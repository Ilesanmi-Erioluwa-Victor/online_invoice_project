const styles = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};

// StatusBadge displays an invoice status using a colour-coded pill.
export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

