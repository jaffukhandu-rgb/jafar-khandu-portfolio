export default function ParticlePortrait() {
  return (
    <div className="particle-hero-intro" data-intro-state="complete">
      <div className="particle-portrait-orbit" aria-hidden="true" />
      <div className="particle-portrait-glow" aria-hidden="true" />

      <div className="particle-profile-photo-wrap">
        <img
          className="particle-profile-photo"
          src="/profile.jpg"
          alt="Jafar Khandu"
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="particle-hero-name">JAFAR KHANDU</div>
      <div className="particle-hero-tagline">Full-Stack .NET Developer</div>
    </div>
  );
}
