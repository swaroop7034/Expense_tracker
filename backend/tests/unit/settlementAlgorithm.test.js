import { describe, it, expect } from 'vitest';
import { calculateSettlements } from '../../src/services/settlementAlgorithm.js';

describe('Settlement Algorithm', () => {
  it('should settle 2 people exactly', () => {
    // Alice owes Bob ₹50
    // Net balances: Alice: -50, Bob: +50
    const membersWithBalances = [
      { member_id: '1', name: 'Alice', net_balance: -50 },
      { member_id: '2', name: 'Bob', net_balance: 50 }
    ];

    const result = calculateSettlements(membersWithBalances);
    
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      from: '1',
      from_name: 'Alice',
      to: '2',
      to_name: 'Bob',
      amount: 50.00
    });
  });

  it('should handle complex settlements with multiple people', () => {
    // A owes 100
    // B owes 50
    // C gets 150
    const membersWithBalances = [
      { member_id: 'A', name: 'A', net_balance: -100 },
      { member_id: 'B', name: 'B', net_balance: -50 },
      { member_id: 'C', name: 'C', net_balance: 150 }
    ];

    const result = calculateSettlements(membersWithBalances);
    
    expect(result.length).toBe(2);
    // A should pay C 100
    // B should pay C 50
    expect(result).toEqual(
      expect.arrayContaining([
        { from: 'A', from_name: 'A', to: 'C', to_name: 'C', amount: 100 },
        { from: 'B', from_name: 'B', to: 'C', to_name: 'C', amount: 50 }
      ])
    );
  });
});
