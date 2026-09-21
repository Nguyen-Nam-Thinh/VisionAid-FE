import { useWorkspace } from '../hooks/useWorkspace';
export function ViuSelect() {
  const { users, selected, setSelected } = useWorkspace();
  return (
    <label className="field">
      Người được chăm sóc
      <select value={selected?.id ?? ''} onChange={(e) => setSelected(e.target.value)}>
        {!users.length && <option value="">Chưa có người được liên kết</option>}
        {users.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
