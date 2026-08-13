// ==========================================
// client/src/pages/Home.jsx
// RangoD TIPS V7 Enterprise
// Premium Home Page
// ==========================================

import Features from "../components/Features";
import Hero from "../components/Hero";
import LiveMatches from "../components/LiveMatches";
import TodayPredictions from "../components/TodayPredictions";
import Competitions from "../components/Competitions";
import Pricing from "../components/Pricing";

import "./Home.css";

function Home() {
    return (
        <main className="rangod-home">

            {/* ==========================================
                HERO
            ========================================== */}
            <section className="home-hero-section">
                <div className="hero-background-glow hero-glow-one" />
                <div className="hero-background-glow hero-glow-two" />
                <div className="hero-grid-overlay" />

                <Hero />
            </section>


            {/* ==========================================
                LIVE & UPCOMING MATCHES
            ========================================== */}
            <section className="home-live-section">
                <div className="section-container">
                    <div className="home-section-heading">
                        <span className="section-eyebrow">
                            LIVE FOOTBALL
                        </span>

                        <h2>
                            Live & Upcoming Matches
                        </h2>

                        <p>
                            Follow today's football action and stay ahead
                            of every important fixture.
                        </p>
                    </div>

                    <div className="home-content-card">
                        <LiveMatches />
                    </div>
                </div>
            </section>


            {/* ==========================================
                TODAY'S AI PREDICTIONS
            ========================================== */}
            <section className="home-predictions-section">
                <div className="home-section-glow glow-blue" />

                <div className="section-container">
                    <div className="home-section-heading">
                        <span className="section-eyebrow prediction-eyebrow">
                            AI POWERED
                        </span>

                        <h2>
                            Today's AI Predictions
                        </h2>

                        <p>
                            Smart football analysis generated from
                            statistics, form, team strength and match data.
                        </p>
                    </div>

                    <div className="home-content-card prediction-card">
                        <TodayPredictions />
                    </div>
                </div>
            </section>


            {/* ==========================================
                COMPETITIONS
            ========================================== */}
            <section className="home-competitions-section">
                <div className="home-section-glow glow-purple" />

                <div className="section-container">
                    <div className="home-section-heading">
                        <span className="section-eyebrow competition-eyebrow">
                            FOOTBALL WORLD
                        </span>

                        <h2>
                            Explore Competitions
                        </h2>

                        <p>
                            Discover predictions and fixtures across
                            major football competitions.
                        </p>
                    </div>

                    <div className="home-content-card">
                        <Competitions />
                    </div>
                </div>
            </section>


            {/* ==========================================
                PLATFORM FEATURES
            ========================================== */}
            <section className="home-features-section">
                <div className="section-container">
                    <div className="home-section-heading">
                        <span className="section-eyebrow">
                            WHY RANGOD TIPS
                        </span>

                        <h2>
                            Built for Smarter Football Decisions
                        </h2>

                        <p>
                            Powerful football intelligence designed to
                            make match analysis simpler and clearer.
                        </p>
                    </div>

                    <Features />
                </div>
            </section>


            {/* ==========================================
                PREMIUM PRICING
            ========================================== */}
            <section className="home-pricing-section">
                <div className="home-section-glow glow-green" />

                <div className="section-container">
                    <div className="home-section-heading pricing-heading">
                        <span className="section-eyebrow pricing-eyebrow">
                            GO PREMIUM
                        </span>

                        <h2>
                            Unlock RangoD TIPS Premium
                        </h2>

                        <p>
                            Get deeper analysis, advanced insights and
                            premium prediction features.
                        </p>
                    </div>

                    <div className="home-content-card pricing-card">
                        <Pricing />
                    </div>
                </div>
            </section>


            {/* ==========================================
                FINAL CTA
            ========================================== */}
            <section className="home-final-cta">
                <div className="final-cta-glow" />

                <div className="final-cta-content">
                    <span className="section-eyebrow">
                        RANGOD TIPS
                    </span>

                    <h2>
                        Make Every Match More Intelligent
                    </h2>

                    <p>
                        Explore today's predictions and discover a
                        smarter way to analyze football.
                    </p>
                </div>
            </section>

        </main>
    );
}

export default Home;