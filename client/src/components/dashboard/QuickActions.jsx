import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Crown,
  Clock,
  User,
} from "lucide-react";

const actions = [
  {
    id: 1,
    title: "View Analysis",
    description: "Browse all AI-powered football predictions",
    icon: BarChart3,
    color: "bg-blue-500",
    to: "/predictions",
  },
  {
    id: 2,
    title: "Premium Tips",
    description: "Unlock high-confidence premium picks",
    icon: Crown,
    color: "bg-yellow-500",
    to: "/premium",
  },
  {
    id: 3,
    title: "Live Matches",
    description: "Follow live games and real-time scores",
    icon: Clock,
    color: "bg-red-500",
    to: "/live",
  },
  {
    id: 4,
    title: "My Account",
    description: "Manage profile, subscription, and settings",
    icon: User,
    color: "bg-purple-500",
    to: "/account",
  },
];

function QuickActions() {
  return (
    <div className="quick-actions-grid">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <NavLink
            key={action.id}
            to={action.to}
            className="quick-action-card group"
          >
            <div className="quick-action-icon">
              <div
                className={`${action.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}
              >
                <Icon size={24} />
              </div>
            </div>

            <div className="quick-action-content">
              <h3 className="quick-action-title">
                {action.title}
              </h3>

              <p className="quick-action-description">
                {action.description}
              </p>
            </div>

            <div className="quick-action-arrow">
              <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">
                →
              </span>
            </div>
          </NavLink>
        );
      })}
    </div>
  );
}

export default QuickActions;
