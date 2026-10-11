import { TIMEZONES } from '../lib/timezones';

// przyjmuje dodatkowe propsy (id, aria-*) z <Field>
const TimezoneSelect = ({ value, onChange, ...rest }) => {
  const list = TIMEZONES.includes(value) ? TIMEZONES : [value, ...TIMEZONES];
  return (
    <select {...rest} value={value} onChange={(e) => onChange(e.target.value)}>
      {list.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
    </select>
  );
};

export default TimezoneSelect;
