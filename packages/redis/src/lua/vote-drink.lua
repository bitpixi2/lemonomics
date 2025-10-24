--[[
Vote Drink Lua Script

Atomically processes a vote on a drink, updates scores, and handles state transitions.
This script ensures idempotent voting and syncs with Reddit vote data.

KEYS[1] = drink:{id} (drink metadata hash)
KEYS[2] = drink:votes:{id} (vote tracking hash)  
KEYS[3] = drinks:featured (featured drinks zset)
KEYS[4] = drinks:pending (pending drinks zset)
KEYS[5] = player:{authorUid}:stats (author stats hash)

ARGV[1] = userId (voter ID)
ARGV[2] = voteDirection (1 for upvote, -1 for downvote)
ARGV[3] = timestamp (current timestamp)
ARGV[4] = featuredThreshold (score needed for featured, default 25)
ARGV[5] = retiredThreshold (score for retirement, default -5)

Returns: {newScore, newState, previousVote}
--]]

local drinkKey = KEYS[1]
local votesKey = KEYS[2]
local featuredKey = KEYS[3]
local pendingKey = KEYS[4]
local authorStatsKey = KEYS[5]

local userId = ARGV[1]
local voteDirection = tonumber(ARGV[2])
local timestamp = tonumber(ARGV[3])
local featuredThreshold = tonumber(ARGV[4]) or 25
local retiredThreshold = tonumber(ARGV[5]) or -5

-- Validate vote direction
if voteDirection ~= 1 and voteDirection ~= -1 then
    return redis.error_reply("Invalid vote direction. Must be 1 or -1")
end

-- Check if drink exists
if redis.call('EXISTS', drinkKey) == 0 then
    return redis.error_reply("Drink not found")
end

-- Get current vote from user (if any)
local previousVote = redis.call('HGET', votesKey, userId)
if previousVote then
    previousVote = tonumber(previousVote)
else
    previousVote = 0
end

-- Calculate score change
local scoreChange = voteDirection - previousVote

-- If no change, return current state
if scoreChange == 0 then
    local currentScore = tonumber(redis.call('HGET', drinkKey, 'score')) or 0
    local currentState = redis.call('HGET', drinkKey, 'state') or 'PENDING'
    return {currentScore, currentState, previousVote}
end

-- Update vote tracking
if voteDirection == 0 then
    -- Remove vote
    redis.call('HDEL', votesKey, userId)
else
    -- Set new vote
    redis.call('HSET', votesKey, userId, voteDirection)
end

-- Update drink score
local newScore = redis.call('HINCRBY', drinkKey, 'score', scoreChange)

-- Get current state
local currentState = redis.call('HGET', drinkKey, 'state')
local newState = currentState

-- Handle state transitions
if currentState == 'PENDING' then
    if newScore >= featuredThreshold then
        -- Promote to FEATURED
        newState = 'FEATURED'
        redis.call('HSET', drinkKey, 'state', newState)
        
        -- Move from pending to featured
        local drinkId = string.match(drinkKey, "drink:([^:]+)")
        redis.call('ZREM', pendingKey, drinkId)
        redis.call('ZADD', featuredKey, newScore, drinkId)
        
        -- Update author stats
        if redis.call('EXISTS', authorStatsKey) == 1 then
            redis.call('HINCRBY', authorStatsKey, 'totalScore', scoreChange)
            
            -- Add to featured drinks list
            local featuredDrinks = redis.call('HGET', authorStatsKey, 'featuredDrinks') or '[]'
            local featuredArray = cjson.decode(featuredDrinks)
            table.insert(featuredArray, drinkId)
            redis.call('HSET', authorStatsKey, 'featuredDrinks', cjson.encode(featuredArray))
        end
        
    elseif newScore <= retiredThreshold then
        -- Retire drink
        newState = 'RETIRED'
        redis.call('HSET', drinkKey, 'state', newState)
        
        -- Remove from pending
        local drinkId = string.match(drinkKey, "drink:([^:]+)")
        redis.call('ZREM', pendingKey, drinkId)
    else
        -- Update score in pending list
        local drinkId = string.match(drinkKey, "drink:([^:]+)")
        redis.call('ZADD', pendingKey, newScore, drinkId)
    end
    
elseif currentState == 'FEATURED' then
    -- Update score in featured list
    local drinkId = string.match(drinkKey, "drink:([^:]+)")
    redis.call('ZADD', featuredKey, newScore, drinkId)
    
    -- Check if should be demoted
    if newScore < featuredThreshold then
        newState = 'PENDING'
        redis.call('HSET', drinkKey, 'state', newState)
        
        -- Move from featured to pending
        redis.call('ZREM', featuredKey, drinkId)
        redis.call('ZADD', pendingKey, newScore, drinkId)
        
        -- Update author stats
        if redis.call('EXISTS', authorStatsKey) == 1 then
            -- Remove from featured drinks list
            local featuredDrinks = redis.call('HGET', authorStatsKey, 'featuredDrinks') or '[]'
            local featuredArray = cjson.decode(featuredDrinks)
            for i, id in ipairs(featuredArray) do
                if id == drinkId then
                    table.remove(featuredArray, i)
                    break
                end
            end
            redis.call('HSET', authorStatsKey, 'featuredDrinks', cjson.encode(featuredArray))
        end
    end
end

-- Update author total score
if redis.call('EXISTS', authorStatsKey) == 1 then
    redis.call('HINCRBY', authorStatsKey, 'totalScore', scoreChange)
end

-- Update last modified timestamp
redis.call('HSET', drinkKey, 'lastModified', timestamp)

return {tonumber(newScore), newState, previousVote}
