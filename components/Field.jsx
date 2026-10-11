// Pole formularza z etykietą, gwiazdką "wymagane" i komunikatem błędu.
// Użycie: <Field id="x" label="..." required error={msg}>{(p) => <input {...p} />}</Field>
const Field = ({ id, label, error, required, children }) => (
  <div className={`field${required ? ' is-required' : ''}${error ? ' has-error' : ''}`}>
    <label htmlFor={id}>{label}</label>
    {children({
      id,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-err` : undefined,
      'aria-required': required ? true : undefined,
    })}
    {error && <p className="field-error" id={`${id}-err`} role="alert">{error}</p>}
  </div>
);

export default Field;
