import { useEffect, useState } from "react";
import axios from "axios";
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminReviewPanelPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/reviews", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReviews(res.data || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [token]);

  // Approve / Reject handler
  const handleAction = async (id, action) => {
    try {
      await axios.post(
        `http://localhost:5000/api/admin/reviews/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update locally → set status without full refetch
      setReviews((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, status: action === "approve" ? "accepted" : "rejected" } : r
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
      <h2 className="mb-6 font-bold text-[var(--text)] text-2xl">Review Words</h2>

      <div className="gap-4 grid">
        {reviews.length === 0 && (
          <GlassCard className="opacity-70 p-6 text-[var(--text)] text-center">
            No words pending review 🎉
          </GlassCard>
        )}

        {reviews.map((r) => (
          <GlassCard
            key={r._id}
            className="flex justify-between items-center p-4 text-[var(--text)]"
          >
            <div className="flex flex-col">
              <span className="font-semibold text-lg">{r.word}</span>
              <span className="opacity-70 text-sm">
                {r.category?.name || "No category"}
              </span>
              <em
                className={`text-xs mt-1 ${
                  r.status === "pending"
                    ? "text-yellow-500"
                    : r.status === "accepted"
                    ? "text-green-500"
                    : "text-rose-500"
                }`}
              >
                {r.status}
              </em>
            </div>

            {/* Buttons only for pending reviews */}
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-green-500 hover:text-white"
                  onClick={() => handleAction(r._id, "approve")}
                >
                  <CheckCircle className="mr-1 w-4 h-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-rose-500 hover:text-white"
                  onClick={() => handleAction(r._id, "reject")}
                >
                  <XCircle className="mr-1 w-4 h-4" /> Reject
                </Button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
