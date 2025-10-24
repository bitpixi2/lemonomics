import { Devvit, useState } from '@devvit/public-api';

interface PowerupShopProps {
  onPowerupClaimed?: (sku: string) => void;
}

export const PowerupShop: Devvit.BlockComponent<PowerupShopProps> = ({ onPowerupClaimed }, context) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Free power-ups available during beta
  const freePowerups = [
    { sku: 'super_sugar', displayName: 'Super Sugar Boost', description: '+25% demand boost for one game' },
    { sku: 'perfect_day', displayName: 'Perfect Day Bonus', description: 'Perfect weather guaranteed' },
    { sku: 'extra_ad', displayName: 'Extra Ad Credit', description: '$10 bonus advertising credit' }
  ];

  const handleClaim = async (sku: string) => {
    setIsLoading(true);
    setMessage('Claiming power-up...');
    
    try {
      // Store power-up in Redis for user (24-hour expiration)
      const powerupKey = `user:${context.userId}:powerups:${sku}`;
      const currentCount = await context.redis.get(powerupKey);
      const newCount = (parseInt(currentCount || '0') + 1).toString();
      
      // Set power-up with expiration
      await context.redis.set(powerupKey, newCount, { expiration: new Date(Date.now() + 86400000) });
      
      setMessage(`✅ ${sku.replace('_', ' ')} claimed successfully!`);
      onPowerupClaimed?.(sku);
    } catch (error) {
      setMessage(`❌ Failed to claim power-up`);
    }
    
    setIsLoading(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  };

  const getPowerupIcon = (sku: string) => {
    switch (sku) {
      case 'super_sugar': return '⚡';
      case 'perfect_day': return '☀️';
      case 'extra_ad': return '📢';
      default: return '💫';
    }
  };

  return (
    <vstack gap="medium" padding="medium">
      <text size="large" weight="bold" alignment="center">
        🛒 Power-up Shop
      </text>
      
      {message && (
        <text 
          size="medium" 
          alignment="center"
          color={message.includes('✅') ? 'green' : 'red'}
        >
          {message}
        </text>
      )}

      <vstack gap="small">
        {freePowerups.map((powerup) => (
          <hstack 
            key={powerup.sku}
            padding="medium"
            backgroundColor="white"
            cornerRadius="medium"
            border="thin"
            borderColor="#ddd"
            gap="medium"
            alignment="center middle"
          >
            <text size="xlarge">{getPowerupIcon(powerup.sku)}</text>
            
            <vstack gap="small" grow>
              <text size="medium" weight="bold">
                {powerup.displayName}
              </text>
              <text size="small" color="#666">
                {powerup.description}
              </text>
            </vstack>
            
            <vstack alignment="center" gap="small">
              <text size="small" weight="bold" color="#28a745">
                FREE (Beta)
              </text>
              <button
                size="small"
                appearance="primary"
                disabled={isLoading}
                onPress={() => handleClaim(powerup.sku)}
              >
                {isLoading ? 'Claiming...' : 'Claim'}
              </button>
            </vstack>
          </hstack>
        ))}
      </vstack>

      <text size="small" color="#888" alignment="center">
        Power-ups are free during beta! They last 24 hours after claiming.
      </text>
    </vstack>
  );
};
