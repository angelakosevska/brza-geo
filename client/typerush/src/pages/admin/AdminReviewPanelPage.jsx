import { useEffect, useState, useMemo } from "react";
import api from "@/lib/axios";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Inbox,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminReviewPanelPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Fetch all reviews from the backend
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get("/admin/reviews");
        setReviews(res.data || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Handle approve / reject action
  const handleAction = async (id, action) => {
    try {
      await api.post(`/admin/reviews/${id}/${action}`, {});
      setReviews((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: action === "approve" ? "accepted" : "rejected" }
            : r
        )
      );
    } catch (err) {
      console.error(`Error trying to ${action} review:`, err);
    }
  };

  // Sorting logic
  const sortedReviews = useMemo(() => {
    let sortable = [...reviews];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        const aVal =
          sortConfig.key === "player"
            ? a.submittedBy?.username || ""
            : sortConfig.key === "category"
            ? a.category?.name || ""
            : a[sortConfig.key] || "";

        const bVal =
          sortConfig.key === "player"
            ? b.submittedBy?.username || ""
            : sortConfig.key === "category"
            ? b.category?.name || ""
            : b[sortConfig.key] || "";

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [reviews, sortConfig]);

  // Handle column sorting click
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <GlassCard className="p-6 text-[var(--text)] text-center animate-pulse">
          Се вчитуваат зборовите за преглед...
        </GlassCard>
      </div>
    );
  }

  // Main content
  return (
    <GlassCard className="w-full max-w-[90vw] text-[var(--text)]/90 p-4">
      {sortedReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center opacity-70 py-10">
          <Inbox className="w-10 h-10 text-[var(--text)]/30" />
          <p>Нема зборови за преглед.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-y-auto overflow-x-auto rounded-3xl">
            <table className="w-full text-sm sm:text-base text-[var(--text)] border-collapse">
              <thead className="sticky top-0 z-20 bg-[var(--primary)]/30 backdrop-blur-3xl border-b border-[var(--text)]/20 shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
                <tr className="text-[var(--text)] font-semibold">
                  <SortableHeader
                    title="Збор"
                    sortKey="word"
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                  />
                  <SortableHeader
                    title="Категорија"
                    sortKey="category"
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                  />
                  <SortableHeader
                    title="Играч"
                    sortKey="player"
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                  />
                  <SortableHeader
                    title="Статус"
                    sortKey="status"
                    sortConfig={sortConfig}
                    requestSort={requestSort}
                  />
                  <th className="p-3 text-center">Акции</th>
                </tr>
              </thead>
              <tbody>
                {sortedReviews.map((r, i) => (
                  <tr
                    key={r._id}
                    className={`border-b border-[var(--text)]/15 ${
                      i % 2 === 0
                        ? "bg-[var(--background)]/40"
                        : "bg-[var(--background)]/20"
                    } hover:bg-[var(--primary)]/10 transition-colors`}
                  >
                    <td className="p-3 font-semibold bg-[var(--primary)]/20">
                      {r.word}
                    </td>
                    <td className="p-3">{r.category?.name || "—"}</td>
                    <td className="p-3 text-sm opacity-80">
                      {r.submittedBy?.username || "Непознат"} (
                      {r.submittedBy?.email || "—"})
                    </td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="p-3 text-center">
                      {r.status === "pending" && (
                        <ActionButtons id={r._id} onAction={handleAction} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="flex flex-col gap-4 md:hidden mt-4">
            {sortedReviews.map((r) => (
              <div
                key={r._id}
                className={`border-l-4 ${
                  r.status === "accepted"
                    ? "border-green-400"
                    : r.status === "rejected"
                    ? "border-rose-500"
                    : "border-amber-300"
                } rounded-xl p-4 bg-[var(--background)]/40 backdrop-blur-sm shadow-sm transition-transform hover:scale-[1.01]`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-[var(--text)] text-base">
                    {r.word}
                  </h3>
                  <StatusBadge status={r.status} />
                </div>

                <div className="text-xs opacity-80 leading-snug">
                  <p>
                    <strong>Категорија:</strong> {r.category?.name || "—"}
                  </p>
                  <p>
                    <strong>Играч:</strong>{" "}
                    {r.submittedBy?.username || "Непознат"} (
                    {r.submittedBy?.email || "—"})
                  </p>
                </div>

                {r.status === "pending" && (
                  <div className="flex justify-end gap-3 mt-3">
                    <ActionButtons
                      id={r._id}
                      onAction={handleAction}
                      iconOnly
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}

/* Sortable header with up/down icon */
function SortableHeader({ title, sortKey, sortConfig, requestSort }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <th
      className="py-5 px-3 text-left cursor-pointer select-none"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {title}
        {isActive ? (
          sortConfig.direction === "asc" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        ) : (
          <ChevronUp className="w-4 h-4 opacity-20" />
        )}
      </div>
    </th>
  );
}

/* Status badge with color + icon */
function StatusBadge({ status }) {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold";
  const map = {
    pending: {
      color: "bg-yellow-200 text-yellow-900",
      icon: <Clock className="w-3 h-3" />,
    },
    accepted: {
      color: "bg-green-200 text-green-800",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    rejected: {
      color: "bg-rose-200 text-rose-800",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const { color, icon } = map[status] || map.pending;
  const label =
    status === "pending"
      ? "Чека"
      : status === "accepted"
      ? "Прифатен"
      : "Одбиен";

  return (
    <span className={`${base} ${color}`}>
      {icon}
      {label}
    </span>
  );
}

/* Approve / Reject buttons with tooltip */
function ActionButtons({ id, onAction }) {
  return (
    <TooltipProvider>
      <div className="flex justify-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onAction(id, "approve")}
              className="hover:bg-green-500/10 hover:scale-110 transition-transform"
            >
              <CheckCircle className="w-5 h-5 text-green-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Прифати</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onAction(id, "reject")}
              className="hover:bg-rose-500/10 hover:scale-110 transition-transform"
            >
              <XCircle className="w-5 h-5 text-rose-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Одбиј</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
