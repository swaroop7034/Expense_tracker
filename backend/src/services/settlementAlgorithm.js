export function calculateSettlements(balances) {
  // balances: [{ member_id, name, net_balance }]  where net_balance = paid - owes (in rupees)
  const transactions = [];

  // Work with mutable copies, and convert to paise for precise math
  let creditors = balances.filter(b => b.net_balance > 0).map(b => ({ ...b, net: Math.round(b.net_balance * 100) }));
  let debtors   = balances.filter(b => b.net_balance < 0).map(b => ({ ...b, net: Math.round(b.net_balance * 100) }));

  while (creditors.length > 0 && debtors.length > 0) {
    // ✅ Re-sort every iteration — critical for true minimum transactions
    creditors.sort((a, b) => b.net - a.net);          // largest positive first
    debtors.sort((a, b) => a.net - b.net);            // most negative first

    const creditor = creditors[0];
    const debtor   = debtors[0];

    const transfer = Math.min(creditor.net, Math.abs(debtor.net));

    transactions.push({
      from:   debtor.member_id,
      from_name: debtor.name,
      to:     creditor.member_id,
      to_name: creditor.name,
      amount: parseFloat((transfer / 100).toFixed(2)), // back to rupees
    });

    creditor.net -= transfer;
    debtor.net   += transfer;

    if (Math.abs(creditor.net) < 1) creditors.shift(); // settled (< 1 paise)
    if (Math.abs(debtor.net)   < 1) debtors.shift();
  }

  return transactions;
}
