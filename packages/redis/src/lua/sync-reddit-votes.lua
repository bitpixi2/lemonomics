--[[
Sync Reddit Votes Lua Script

Batch synchronizes Reddit post votes to Redis for score calculation.
This script processes multiple vote updates atomically.

KEYS[1] = drink:{id} (drink metadata hash)
KEYS[2] = drink:votes:{id} (vote tracking hash)
KEYS[3] = drinks:featured (featured drinks zset)
KEYS[4] = drinks:pending (pending drinks zset)

ARGV[1] = JSON string of vote updates: [{"userId": "u1", "vote": 1}, {"userId": "u2", "vote": -1}, ...]
ARGV[2] = timestamp (current timestamp)
ARGV[3] = featuredThreshold (score needed for featured, default 25)
ARGV[4] = retiredThreshold (score for retirement, default -5)

Returns: {newScore, newState, updatedVotes}
--]]

local drinkKey = KEYS[1]
local votesKey = KEYS[2]
local featuredKey = KEYS[3]
local pendingKey = KEYS[4]

local voteUpdatesJson = ARGV[1]
local timestamp = tonumber(ARGV[2])
local featuredThreshold = tonumber(ARGV[3]) or 25
local retiredThreshold = tonumber(ARGV[4]) or -5

-- Check if drink exists
if redis.call('EXISTS', drinkKey) == 0 then
    return redis.error_reply("Drink not found")
end

-- Parse vote updates
local voteUpdates = cjson.decode(voteUpdatesJson)
local totalScoreChange = 0
local updatedVotes = 0

-- Process each vote update
for _, update in ipairs(voteUpdates) do
    local userId = update.userId
    local newVote = tonumber(update.vote)
    
    -- Validate vote direction
    if newVote ~= 1 and newVote ~= -1 and newVote ~= 0 then
        return redis.error_reply("Invalid vote direction: " .. tostring(newVote))
    end
    
    -- Get current vote
    local currentVote = redis.call('HGET', votesKey, userId)
    if currentVote then
        currentVote = tonumber(currentVote)
    else
        currentVote = 0
    end
    
    -- Calculate score change for this vote
    local scoreChange = newVote - currentVote
    
    if scoreChange ~= 0 then
        totalScoreChange = totalScoreChange + scoreChange
        updatedVotes = updatedVotes + 1
        
        -- Update vote tracking
        if newVote == 0 then
            redis.call('HDEL', votesKey, userId)
        else
            redis.call('HSET', votesKey, userId, newVote)
        end
    end
end

-- If no changes, return current state
if totalScoreChange == 0 then
    local currentScore = tonumber(redis.call('HGET', drinkKey, 'score')) or 0
    local currentState = redis.call('HGET', drinkKey, 'state') or 'PENDING'
    return {currentScore, currentState, updatedVotes}
end

-- Update drink score
local newScore = redis.call('HINCRBY', drinkKey, 'score', totalScoreChange)

-- Get current state
local currentState = redis.call('HGET', drinkKey, 'state')
local newState = currentState
local drinkId = string.match(drinkKey, "drink:([^:]+)")

-- Handle state transitions
if currentState == 'PENDING' then
    if newScore >= featuredThreshold then
        -- Promote to FEATURED
        newState = 'FEATURED'
        redis.call('HSET', drinkKey, 'state', newState)
        redis.call('ZREM', pendingKey, drinkId)
        redis.call('ZADD', featuredKey, newScore, drinkId)
        
    elseif newScore <= retiredThreshold then
        -- Retire drink
        newState = 'RETIRED'
        redis.call('HSET', drinkKey, 'state', newState)
        redis.call('ZREM', pendingKey, drinkId)
    else
        -- Update score in pending list
        redis.call('ZADD', pendingKey, newScore, drinkId)
    end
    
elseif currentState == 'FEATURED' then
    -- Update score in featured list
    redis.call('ZADD', featuredKey, newScore, drinkId)
    
    -- Check if should be demoted
    if newScore < featuredThreshold then
        newState = 'PENDING'
        redis.call('HSET', drinkKey, 'state', newState)
        redis.call('ZREM', featuredKey, drinkId)
        redis.call('ZADD', pendingKey, newScore, drinkId)
    end
end

-- Update last sync timestamp
redis.call('HSET', drinkKey, 'lastSyncedAt', timestamp)

return {tonumber(newScore), newState, updatedVotes}
