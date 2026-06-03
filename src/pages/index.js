import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs">
            开始阅读
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="个人学习笔记">
      <HomepageHeader />
      <main>
        <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Link to="/docs" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem 2rem' }}>
                <h3>📚 文档</h3>
                <p>学习资料与笔记</p>
              </div>
            </Link>
            <Link to="/blog" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem 2rem' }}>
                <h3>📝 博客</h3>
                <p>时间线文章</p>
              </div>
            </Link>
            <Link to="/docs/tags" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem 2rem' }}>
                <h3>🏷️ 标签</h3>
                <p>按主题浏览</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
