import '../styles/slider.css';

// Suwak-"pigułka": etykieta po lewej, wartość po prawej, wypełnienie rośnie od lewej strony.
// Natywny <input type="range"> leży na wierzchu (niewidoczny), więc działa klawiatura, dotyk i czytniki ekranu.
// Tekst w wypełnionej części zmienia kolor dzięki drugiej, przyciętej warstwie z etykietami.
const Slider = ({ label, value, min, max, step = 1, format = (v) => v, onChange, onPointerDown, onKeyDown, id }) => {
  const span = max - min || 1;
  const pct = Math.min(100, Math.max(0, ((value - min) / span) * 100));
  const shown = format(value);

  return (
    <div className="slider" style={{ '--pct': `${pct}%` }}>
      <div className="slider-layer slider-base" aria-hidden="true">
        <span>{label}</span>
        <span className="slider-value">{shown}</span>
      </div>
      <div className="slider-layer slider-fill" aria-hidden="true">
        <span>{label}</span>
        <span className="slider-value">{shown}</span>
      </div>
      <input
        id={id}
        type="range"
        aria-label={label}
        aria-valuetext={String(shown)}
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

export default Slider;
