import React from "react";
import { Link } from "react-router-dom";
import "./PageLayout.css";
import StorageNotice from "../StorageNotice";
import Settings from "../Settings";
import OfflineStatus from "../OfflineStatus";

interface PageLayoutProps {
  /** Rendered as the page's only h1, unless showTitle is false. */
  title: string;
  showTitle?: boolean;
  eyebrow?: React.ReactNode;
  lede?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * The frame every page is laid out in.
 *
 * The notice in the footer is not boilerplate. These patterns are sold to
 * fund Shetland Wool Week, and this site is a companion to one you have
 * bought, not a substitute for buying it. Saying so belongs on every page.
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  showTitle = true,
  eyebrow,
  lede,
  aside,
  children,
  className,
}) => (
  <div className={className ? `page ${className}` : "page"}>
    <header className="masthead screen-only">
      <Link to="/" className="masthead-title">
        Wool Week Toories
      </Link>
      <div className="masthead-actions">
        {aside}
        <Settings />
      </div>
    </header>
    <StorageNotice />
    {eyebrow && <p className="eyebrow screen-only">{eyebrow}</p>}
    {showTitle && <h1 className="page-title">{title}</h1>}
    {lede && <p className="lede screen-only">{lede}</p>}
    {children}
    <footer className="colophon screen-only">
      <OfflineStatus />
      <p>
        An unofficial companion for knitters who have bought these patterns.
        The designs belong to their designers and are sold to fund{" "}
        <a href="https://www.shetlandwoolweek.com/" target="_blank" rel="noreferrer">
          Shetland Wool Week
        </a>
        . Please buy the pattern you are knitting.
      </p>
      <p className="quiet">
        Your projects are kept in this browser, on this device. Nothing is sent
        anywhere. To move them or keep a copy, save a backup from Settings.
      </p>
    </footer>
  </div>
);

export default PageLayout;
