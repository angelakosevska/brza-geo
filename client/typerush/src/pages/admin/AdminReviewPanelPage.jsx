import { useEffect, useState } from "react";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import api from "@/lib/axios"; // 👈 use your preconfigured axios instance

export default function AdminReviewPanelPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get("/api/admin/reviews"); // no need for token manually
        setReviews(res.data || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Approve / Reject handler
  const handleAction = async (id, action) => {
    try {
      await api.post(`/api/admin/reviews/${id}/${action}`);
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

  if (loading) {
    return (
      <div className="p-6">
        <GlassCard className="p-6 text-[var(--text)] text-center">
          Loading reviews…
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-6">
      {reviews.length === 0 ? (
        <GlassCard className="opacity-70 p-6 text-[var(--text)] text-center">
          Нема предложени зборови!
        </GlassCard>
      ) : (
        <div className="gap-4 grid sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <GlassCard
              key={r._id}
              className="flex flex-col justify-between p-4 text-[var(--text)]"
            >
              {/* Word info */}
              <div>
                <span className="font-semibold text-lg">{r.word}</span>
                <div className="opacity-70 text-sm">
                  {r.category?.name || "Uncategorized"}
                </div>
                <div
                  className={`text-xs mt-1 font-medium uppercase ${
                    r.status === "pending"
                      ? "text-yellow-500"
                      : r.status === "accepted"
                      ? "text-green-500"
                      : "text-rose-500"
                  }`}
                >
                  {r.status}
                </div>
              </div>

              {/* Actions */}
              {r.status === "pending" && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-green-500 hover:text-white"
                    onClick={() => handleAction(r._id, "approve")}
                  >
                    <CheckCircle className="mr-1 w-4 h-4" /> Прифати
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 hover:bg-rose-500 hover:text-white"
                    onClick={() => handleAction(r._id, "reject")}
                  >
                    <XCircle className="mr-1 w-4 h-4" /> Одбиј
                  </Button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
