export default function ProfileScreen({ skin, onOpenSelector, onOpenSettings }) {
  const settings = [
    { label: 'Preferred Skin', value: skin.name, action: onOpenSelector },
    { label: 'Voice Preference', value: 'John Maxwell Voice', action: onOpenSettings },
    { label: 'Theme', value: 'Dark Gold', action: onOpenSettings },
    { label: 'About John Maxwell', value: 'Leadership. Impact. Growth.', action: onOpenSettings },
  ];

  return (
    <section className="productScreen profileScreen">
      <div className="profileMark" aria-hidden="true">JM</div>
      <div className="screenHeading profileHeading">
        <p className="eyebrow">Profile</p>
        <h2>John Maxwell</h2>
      </div>

      <div className="settingsList">
        {settings.map((item) => (
          <button key={item.label} className="settingsRow" type="button" onClick={item.action}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
