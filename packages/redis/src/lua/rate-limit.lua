--[[
Rate Limit Lua Script

Implements sliding window rate limiting using Redis ZSET.
Checks if user can perform action and updates the rate limit counter.

KEYS[1] = rl:{action}:{uid} (rate limit zset for user and action)

ARGV[1] = currentTimestamp (current time in milliseconds)
ARGV[2] = windowSize (window size in milliseconds, e.g., 60000 for 1 minute)
ARGV[3] = maxRequests (maximum requests allowed in window)
ARGV[4] = requestId (unique identifier for this request, usually timestamp + random)

Returns: {allowed (1 or 0), currentCount, resetTime}
--]]

local rateLimitKey = KEYS[1]
local currentTime = tonumber(ARGV[1])
local windowSize = tonumber(ARGV[2])
local maxRequests = tonumber(ARGV[3])
local requestId = ARGV[4]

-- Calculate window start time
local windowStart = currentTime - windowSize

-- Remove expired entries (older than window)
redis.call('ZREMRANGEBYSCORE', rateLimitKey, '-inf', windowStart)

-- Count current requests in window
local currentCount = redis.call('ZCARD', rateLimitKey)

-- Check if limit exceeded
if currentCount >= maxRequests then
    -- Get the oldest entry to determine reset time
    local oldestEntries = redis.call('ZRANGE', rateLimitKey, 0, 0, 'WITHSCORES')
    local resetTime = currentTime
    
    if #oldestEntries > 0 then
        resetTime = tonumber(oldestEntries[2]) + windowSize
    end
    
    return {0, currentCount, resetTime}
end

-- Add current request to window
redis.call('ZADD', rateLimitKey, currentTime, requestId)

-- Set expiration for cleanup (window size + buffer)
redis.call('EXPIRE', rateLimitKey, math.ceil(windowSize / 1000) + 60)

-- Calculate reset time (when window will be clear)
local resetTime = currentTime + windowSize

return {1, currentCount + 1, resetTime}
