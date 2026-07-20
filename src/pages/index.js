import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <span className={styles.heroLabel}>Personal Knowledge Base</span>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroCta}>
          <Link className={styles.ctaButton} to="/notes">
            <span>开始阅读</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
      <div className={styles.heroDecoration}>
        <div className={styles.heroLine}></div>
      </div>
    </header>
  );
}

function NavigationCard({ to, title, description, index }) {
  return (
    <Link to={to} className={styles.navCard} style={{ animationDelay: `${index * 0.1}s` }}>
      <span className={styles.navCardIndex}>{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.navCardContent}>
        <h3 className={styles.navCardTitle}>{title}</h3>
        <p className={styles.navCardDesc}>{description}</p>
      </div>
      <svg className={styles.navCardArrow} width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M6 14l8-8M6 6h8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

function HomepageNavigation() {
  const navItems = [
    { to: '/notes', title: '理论知识', description: '系统化的学习笔记 · LLM / RAG / Agent 框架 · Python·Node.js' },
    { to: '/projects', title: '项目实战', description: '从理论到实践 · 通过真实项目巩固学习成果 · 通用·工作流·垂类' },
  ];

  return (
    <section className={styles.navigation}>
      <div className={styles.navGrid}>
        {navItems.map((item, index) => (
          <NavigationCard key={item.to} {...item} index={index} />
        ))}
      </div>
    </section>
  );
}

function HomepageFootnote() {
  return (
    <div className={styles.footnote}>
      <span className={styles.footnoteLine}></span>
      <p className={styles.footnoteText}>
        专注 · 记录 · 成长
      </p>
    </div>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="个人学习笔记">
      <main className={styles.main}>
        <HomepageHero />
        <HomepageNavigation />
        <HomepageFootnote />
      </main>
    </Layout>
  );
}
