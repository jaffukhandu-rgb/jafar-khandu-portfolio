import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Github, Linkedin, Mail, Menu, X, Download, Code2, Database, Server, Layers3, CheckCircle2 } from 'lucide-react';
import './styles.css';

const projects = [
  {
    title: 'TaskManagement / CodeQueue',
    label: 'Featured · Full-Stack .NET',
    description: 'A structured project and task management platform with authentication, assignment workflows, reviews, payment decisions, real-time communication, notifications and automated deadline reminders.',
    stack: ['ASP.NET Core', 'C#', 'MVC', 'EF Core', 'SQL Server', 'Identity', 'SignalR'],
    link: 'https://codequeue.ciitstudent.com/'
  },
  {
    title: 'Unique Interior',
    label: 'Production Business Application',
    description: 'A real-world interior design business application built around a modern customer experience, content management and cloud-hosted media workflow.',
    stack: ['ASP.NET Core', 'MongoDB', 'Cloudinary', 'C#', 'Nginx'],
    link: 'https://uniqueinteriors.shop/'
  },
  {
    title: 'Melange Parfum',
    label: 'Modern E-commerce',
    description: 'A modern full-stack perfume commerce platform with authentication, payments, media handling, database integration and a responsive product experience.',
    stack: ['Next.js', 'React', 'TypeScript', 'MongoDB', 'Cloudinary', 'Razorpay'],
    link: 'https://perfumewebsite-lt72tgwqm-jk-6157.vercel.app/collection'
  }
];

const skills = [
  { icon: Server, title: 'Backend', items: ['ASP.NET Core', 'C#', 'MVC', 'REST APIs', 'Entity Framework Core', 'Authentication & Authorization'] },
  { icon: Code2, title: 'Frontend', items: ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Responsive UI'] },
  { icon: Database, title: 'Database', items: ['SQL Server', 'MongoDB', 'PostgreSQL', 'Mongoose', 'Data Modeling'] },
  { icon: Layers3, title: 'Tools & Services', items: ['Git & GitHub', 'Cloudinary', 'Nginx', 'Linux', 'Vercel', 'REST Clients'] }
];

function App() {
  const [open, setOpen] = useState(false);
  const nav = ['Home', 'About', 'Skills', 'Projects', 'Experience', 'Contact'];
  const go = (id) => { document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); };

  return (
    <div className="site-shell">
      <header className="nav-wrap">
        <nav className="nav container">
          <button className="brand" onClick={() => go('home')} aria-label="Go to home"><span>JK</span> Jafar Khandu</button>
          <div className={`nav-links ${open ? 'open' : ''}`}>
            {nav.map(item => <button key={item} onClick={() => go(item)}>{item}</button>)}
            <a className="nav-resume" href="/Jafar-Khandu-Resume.pdf" download><Download size={16}/> Resume</a>
          </div>
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
        </nav>
      </header>

      <main>
        <section id="home" className="hero container">
          <div className="hero-copy">
            <div className="eyebrow"><span className="dot"/> Available for opportunities</div>
            <p className="kicker">FULL-STACK .NET DEVELOPER</p>
            <h1>Hi, I'm <em>Jafar</em>.<br/><span>I build useful web products.</span></h1>
            <p className="hero-text">From backend logic to user experience, I build web applications that solve real problems.</p>
            <div className="hero-actions">
              <button className="btn primary" onClick={() => go('projects')}>View My Work <ArrowUpRight size={18}/></button>
              <a className="btn secondary" href="/Jafar-Khandu-Resume.pdf" download><Download size={17}/> Download Resume</a>
            </div>
            <div className="hero-stack">.NET <b>+</b> ASP.NET Core <b>+</b> React <b>+</b> REST APIs <b>+</b> SQL <b>+</b> MongoDB</div>
          </div>
          <div className="hero-visual" aria-label="Developer profile">
            <div className="portrait-card">
              <div className="portrait-ring"><div className="portrait-initials">JK</div></div>
              <div className="portrait-meta"><strong>Jafar Khandu</strong><span>Full-Stack Developer · Pune</span></div>
            </div>
            <div className="code-card"><span>01</span><code>build(<b>ideas</b>)</code><span>02</span><code>ship(<b>quality</b>)</code><span>03</span><code>learn(<b>always</b>)</code></div>
          </div>
        </section>

        <section id="about" className="section container">
          <div className="section-heading"><span>01</span><div><p className="kicker">ABOUT</p><h2>Building with purpose,<br/>not just code.</h2></div></div>
          <div className="about-grid">
            <p className="lead">I'm a Full-Stack .NET Developer based in Pune, focused on building reliable applications across the backend, database and frontend.</p>
            <div className="about-copy"><p>I enjoy turning real requirements into clean, maintainable software — from designing APIs and data models to building responsive interfaces and production deployments.</p><p>My strongest work sits at the intersection of <strong>ASP.NET Core, C#, databases and React</strong>, with hands-on experience building both business applications and modern e-commerce products.</p></div>
          </div>
        </section>

        <section id="skills" className="section muted">
          <div className="container"><div className="section-heading"><span>02</span><div><p className="kicker">TECHNICAL SKILLS</p><h2>Tools I use to<br/>ship complete products.</h2></div></div>
            <div className="skills-grid">{skills.map(({icon: Icon, title, items}) => <article className="skill-card" key={title}><Icon size={22}/><h3>{title}</h3><div className="tag-list">{items.map(x => <span key={x}>{x}</span>)}</div></article>)}</div>
          </div>
        </section>

        <section id="projects" className="section container">
          <div className="section-heading"><span>03</span><div><p className="kicker">SELECTED WORK</p><h2>Projects that show<br/>how I think and build.</h2></div></div>
          <div className="projects-list">{projects.map((p, i) => <article className={`project ${i === 0 ? 'featured' : ''}`} key={p.title}><div className="project-index">0{i+1}</div><div className="project-main"><p className="project-label">{p.label}</p><h3>{p.title}</h3><p>{p.description}</p><div className="tag-list">{p.stack.map(x => <span key={x}>{x}</span>)}</div></div><a className="project-link" href={p.link} target="_blank" rel="noreferrer" aria-label={`Open ${p.title}`}>Live <ArrowUpRight size={18}/></a></article>)}</div>
        </section>

        <section id="experience" className="section muted">
          <div className="container"><div className="section-heading"><span>04</span><div><p className="kicker">EXPERIENCE</p><h2>From requirements<br/>to production.</h2></div></div>
            <div className="timeline"><div className="timeline-line"/><article><div className="time-dot"/><div><p className="time-date">CRAVITA TECHNOLOGIES</p><h3>Full-Stack .NET Developer</h3><p>Worked across application development, backend services, databases and web interfaces, translating requirements into practical software and improving features through iterative development.</p></div></article></div>
            <div className="approach"><div><p className="kicker">MY DEVELOPMENT APPROACH</p><h3>Understand → Design → Build → Test → Deploy</h3></div><div className="approach-note"><CheckCircle2 size={18}/><span>Simple architecture. Clear code. Production mindset.</span></div></div>
          </div>
        </section>

        <section id="contact" className="contact container"><p className="kicker">05 · CONTACT</p><h2>Have a project in mind?</h2><p>Let's talk about what you're building, what needs fixing, or what could be improved.</p><a className="btn primary" href="mailto:jafarkhanduwala@gmail.com">Start a conversation <Mail size={18}/></a><div className="socials"><a href="mailto:jafarkhanduwala@gmail.com"><Mail size={18}/> Email</a><a href="https://www.linkedin.com/" target="_blank" rel="noreferrer"><Linkedin size={18}/> LinkedIn</a><a href="https://github.com/jaffukhandu-rgb" target="_blank" rel="noreferrer"><Github size={18}/> GitHub</a></div></section>
      </main>

      <footer className="footer container"><span>© {new Date().getFullYear()} Jafar Khandu</span><span>Designed & built with React</span></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
