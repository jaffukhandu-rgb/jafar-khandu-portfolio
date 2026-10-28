import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Download, Mail, Menu, X, Code2, Database, Server, Layers3, CheckCircle2 } from 'lucide-react';
import './styles.css';
import './project-scroll.css';

const projects = [
  {
    title: 'TaskManagement / CodeQueue',
    category: 'REAL-TIME · FULL-STACK .NET',
    description: 'A structured project and task management platform with authentication, assignment workflows, reviews, payment decisions, real-time communication, notifications and automated deadline reminders.',
    stack: ['ASP.NET Core', 'C#', 'MVC', 'EF Core', 'SQL Server', 'SignalR'],
    link: 'https://codequeue.ciitstudent.com/',
    number: '01'
  },
  {
    title: 'Unique Interior',
    category: 'BUSINESS · PRODUCTION APP',
    description: 'A real-world interior design business application built around a modern customer experience, content management and cloud-hosted media workflow.',
    stack: ['ASP.NET Core', 'MongoDB', 'Cloudinary', 'C#', 'Nginx'],
    link: 'https://uniqueinteriors.shop/',
    number: '02'
  },
  {
    title: 'Melange Parfum',
    category: 'ECOMMERCE · NEXT.JS',
    description: 'A modern full-stack perfume commerce platform with authentication, payments, media handling, database integration and a responsive product experience.',
    stack: ['Next.js', 'React', 'TypeScript', 'MongoDB', 'Razorpay'],
    link: 'https://perfumewebsite-lt72tgwqm-jk-6157.vercel.app',
    number: '03'
  }
];

const skills = [
  { icon: Server, title: 'Backend', items: ['ASP.NET Core', 'C#', 'MVC', 'REST APIs', 'EF Core', 'Authentication'] },
  { icon: Code2, title: 'Frontend', items: ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Responsive UI'] },
  { icon: Database, title: 'Data', items: ['SQL Server', 'MongoDB', 'PostgreSQL', 'Mongoose', 'Data Modeling'] },
  { icon: Layers3, title: 'Delivery', items: ['Git & GitHub', 'Ubuntu VPS', 'Nginx', 'HTTPS / Certbot', 'Cloudinary', 'Vercel'] }
];

function App() {
  const [open, setOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const nav = ['Work', 'About', 'Experience', 'Contact'];
  const resumeUrl = '/resume.html';

  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setOpen(false);
  };

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => observer.observe(item));

    const projectItems = document.querySelectorAll('.project-story-item');
    const projectObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.projectIndex);
            if (Number.isInteger(index)) setActiveProject(index);
          }
        });
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
    );
    projectItems.forEach((item) => projectObserver.observe(item));

    const onPointerMove = (event) => {
      document.documentElement.style.setProperty('--mx', `${event.clientX}px`);
      document.documentElement.style.setProperty('--my', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const hero = document.querySelector('.hero');
    const heroInner = document.querySelector('.hero-inner');
    const heroParallaxItems = document.querySelectorAll('[data-hero-parallax]');
    const starfield = document.querySelector('.starfield');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rafId = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const renderParallax = () => {
      rafId = 0;
      if (reduceMotion || !hero) return;

      const heroRect = hero.getBoundingClientRect();
      const progress = clamp(-heroRect.top / Math.max(heroRect.height * 0.82, 1), 0, 1.15);
      const heroShift = progress * -52;
      const heroScale = 1 - progress * 0.055;
      const heroOpacity = 1 - progress * 0.72;

      if (heroInner) {
        heroInner.style.transform = `translate3d(0, ${heroShift}px, 0) scale(${heroScale})`;
        heroInner.style.opacity = `${clamp(heroOpacity, 0.18, 1)}`;
      }

      heroParallaxItems.forEach((item) => {
        const speed = Number(item.dataset.speed || 1);
        const drift = Number(item.dataset.drift || 0);
        const rotate = Number(item.dataset.rotate || 0);
        const depth = progress * speed;
        const x = Math.sin(progress * Math.PI) * drift;
        const y = depth * -120;
        const rotation = rotate * depth;
        const scale = 1 - depth * 0.08;
        const opacity = clamp(1 - depth * 0.7, 0.08, 1);

        item.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
        item.style.opacity = `${opacity}`;
      });

      if (starfield) {
        starfield.style.transform = `translate3d(0, ${progress * -36}px, 0) scale(${1 + progress * 0.035})`;
        starfield.style.opacity = `${clamp(1 - progress * 0.45, 0.45, 1)}`;
      }
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(renderParallax);
    };

    if (!reduceMotion) {
      window.addEventListener('scroll', onScroll, { passive: true });
      renderParallax();
    }

    return () => {
      observer.disconnect();
      projectObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const active = projects[activeProject];

  return (
    <div className="site-shell">
      <div className="ambient-glow" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="nav-wrap">
        <nav className="nav container">
          <button className="brand" onClick={() => go('home')} aria-label="Go to home">
            <span>Jafar Khandu</span>
          </button>

          <div className={`nav-links ${open ? 'open' : ''}`}>
            {nav.map((item) => (
              <button key={item} onClick={() => go(item.toLowerCase())}>{item}</button>
            ))}
            <a href={resumeUrl} target="_blank" rel="noreferrer"><Download size={14} /> Résumé</a>
            <button className="nav-cta" onClick={() => go('contact')}>Start a project</button>
          </div>

          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </nav>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="starfield" aria-hidden="true">
            {Array.from({ length: 38 }).map((_, i) => <span key={i} style={{ '--i': i }} />)}
          </div>

          <div className="floating-note note-left" data-hero-parallax data-speed="0.72" data-drift="18" data-rotate="-4">Currently building: <b>full-stack systems</b></div>
          <div className="floating-note note-right" data-hero-parallax data-speed="1.18" data-drift="-24" data-rotate="7">backend · frontend · deployment</div>
          <div className="floating-note note-bottom" data-hero-parallax data-speed="0.88" data-drift="30" data-rotate="-6">Make it reliable. Then make it beautiful.</div>

          <div className="hero-inner container">
            <div className="hero-portrait reveal">
              <div className="portrait-orbit" />
              <img src="/profile.jpg" alt="Jafar Khandu" />
            </div>
            <p className="eyebrow reveal"><span /> FULL-STACK SOFTWARE DEVELOPER · PUNE</p>
            <h1 className="hero-title reveal">I build web products<br /><em>that feel considered.</em></h1>
            <p className="hero-subtitle reveal">Reliable backend systems, responsive interfaces and real-time experiences — built from idea to production.</p>

            <div className="hero-actions reveal">
              <button className="pill-button filled" onClick={() => go('work')}>View work <ArrowUpRight size={17} /></button>
              <button className="text-button" onClick={() => go('about')}>About me <ArrowUpRight size={15} /></button>
              <a className="text-button" href={resumeUrl} target="_blank" rel="noreferrer">Download résumé <Download size={15} /></a>
            </div>

            <div className="hero-stats reveal">
              <div><strong>03</strong><span>SELECTED PROJECTS</span></div>
              <div><strong>.NET</strong><span>BACKEND SPECIALIZATION</span></div>
              <div><strong>FULL-STACK</strong><span>END-TO-END DELIVERY</span></div>
            </div>
          </div>
        </section>

        <section id="work" className="work-section section container">
          <div className="section-intro reveal">
            <span className="section-number">01</span>
            <div>
              <p className="kicker">SELECTED WORK</p>
              <h2>Systems built for<br /><em>real use.</em></h2>
            </div>
          </div>

          <div className="projects-story">
            <div className="project-stage-wrap">
              <div className="project-stage" aria-live="polite">
                <div className="project-stage-inner">
                  <div className="visual-grid" />
                  <div className="visual-window">
                    <span className="window-dot" /><span className="window-dot" /><span className="window-dot" />
                    <div className="window-lines"><i /><i /><i /><i /></div>
                    <strong>{active.number}</strong>
                  </div>
                  <span className="visual-label">{active.category}</span>
                </div>
              </div>
            </div>

            <div className="project-story-copy">
              {projects.map((project, index) => (
                <article className="project-story-item" data-project-index={index} key={project.title}>
                  <div className="project-copy">
                    <div className="project-meta"><span>{project.number}</span><span>{project.category}</span></div>
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="project-tags">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
                    <a className="case-link" href={project.link} target="_blank" rel="noreferrer">Explore project <ArrowUpRight size={17} /></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="about-section section">
          <div className="container">
            <div className="section-intro reveal">
              <span className="section-number">02</span>
              <div><p className="kicker">ABOUT</p><h2>Practical engineering,<br /><em>human interfaces.</em></h2></div>
            </div>
            <div className="about-editorial reveal">
              <p className="about-lead">I'm Jafar, a Full-Stack Software Developer based in Pune. I like turning real requirements into software that is clear, reliable and ready to ship.</p>
              <div className="about-details">
                <p>My strongest work sits at the intersection of <strong>ASP.NET Core, C#, SQL Server, Razor, JavaScript, SignalR and React</strong>. I work across application logic, data access, responsive UI, real-time features and production deployment.</p>
                <p>I also enjoy the less glamorous parts of engineering: debugging difficult frontend and SignalR issues, reducing unnecessary database queries, and keeping a product stable after it goes live.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="capabilities section container">
          <div className="section-intro reveal">
            <span className="section-number">03</span>
            <div><p className="kicker">CAPABILITIES</p><h2>The tools behind<br /><em>the work.</em></h2></div>
          </div>
          <div className="skills-editorial">
            {skills.map(({ icon: Icon, title, items }) => (
              <article className="capability-card reveal" key={title}>
                <Icon size={20} />
                <h3>{title}</h3>
                <div>{items.map((item) => <span key={item}>{item}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="experience-section section">
          <div className="container">
            <div className="section-intro reveal">
              <span className="section-number">04</span>
              <div><p className="kicker">EXPERIENCE</p><h2>From requirements<br /><em>to production.</em></h2></div>
            </div>
            <div className="experience-list">
              <article className="experience-item reveal">
                <div className="experience-date">CURRENT · Y-SAAS INFOTECH</div>
                <div><h3>Full-Stack Software Developer</h3><p>Developed and enhanced CIIT TaskHub using C#, ASP.NET Core, .NET 10, Entity Framework Core, SQL Server, Razor, JavaScript and SignalR. Worked across task management, dashboards, reviews, reports, payment workflows, notifications, chat and real-time UI synchronization.</p><p>Debugged complex frontend and SignalR regressions, reduced unnecessary and N+1 database queries, and maintained responsive admin and user interfaces.</p></div>
              </article>
              <article className="experience-item reveal">
                <div className="experience-date">PREVIOUS · CRAVITA TECHNOLOGIES</div>
                <div><h3>Full Stack Intern</h3><p>Built responsive React.js interfaces, integrated REST APIs, improved cross-browser and mobile experiences, and worked with Git/GitHub feature branches and code reviews.</p></div>
              </article>
            </div>
            <div className="approach reveal"><div><p className="kicker">MY APPROACH</p><h3>Understand → Design → Build → Test → Deploy</h3></div><div className="approach-note"><CheckCircle2 size={17} /> Simple architecture. Clear code. Production mindset.</div></div>
          </div>
        </section>

        <section id="contact" className="contact-section section container reveal">
          <p className="kicker">05 · CONTACT</p>
          <h2>Let's build something<br /><em>worth using.</em></h2>
          <p>Have a project, a product idea, or a system that needs improvement? I'm open to a conversation.</p>
          <a className="pill-button filled contact-button" href="mailto:jaffarkhanduwala@gmail.com">Start a conversation <Mail size={17} /></a>
          <div className="socials">
            <a href="mailto:jaffarkhanduwala@gmail.com"><Mail size={16} /> Email</a>
            <a href="https://wa.me/918875993253" target="_blank" rel="noreferrer"><span className="social-mark" aria-hidden="true">WA</span> WhatsApp</a>
            <a href="https://www.linkedin.com/in/jafar-khandu-7ba828427" target="_blank" rel="noreferrer"><span className="social-mark" aria-hidden="true">in</span> LinkedIn</a>
            <a href="https://github.com/jaffukhandu-rgb" target="_blank" rel="noreferrer"><span className="social-mark" aria-hidden="true">GH</span> GitHub</a>
          </div>
        </section>
      </main>

      <footer className="footer container">
        <span>© {new Date().getFullYear()} Jafar Khandu</span>
        <span>Built with React · C# · curiosity</span>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
