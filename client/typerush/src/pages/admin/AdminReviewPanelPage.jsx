import { useEffect, useState } from "react";
import api from "@/lib/axios"; // api instance
import GlassCard from "@/components/global/GlassCard";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminReviewPanelPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all review words
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get("/admin/reviews");
        setReviews(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Handle approve / reject
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
      console.error(`❌ Error trying to ${action} review:`, err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <GlassCard className="p-6 text-[var(--text)] text-center">
          Вчитувам зборови за преглед…
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="p-6">
      <GlassCard className="overflow-x-auto">
        {reviews.length === 0 ? (
          <div className="opacity-70 p-6 text-[var(--text)] text-center">
            Нема зборови за преглед 🎉
          </div>
        ) : (
          <table className="w-full text-sm sm:text-base border-collapse">
            <thead>
              <tr className="border-[var(--text)]/20 border-b text-left">
                <th className="p-3">Збор</th>
                <th className="p-3">Категорија</th>
                <th className="p-3">Играч</th>
                <th className="p-3">Статус</th>
                <th className="p-3 text-center">Акции</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr
                  key={r._id}
                  className="hover:bg-[var(--primary)]/5 border-[var(--text)]/10 border-b"
                >
                  <td className="p-3 font-medium">{r.word}</td>
                  <td className="p-3">{r.category?.name || "—"}</td>
                  <td className="p-3">
                    {r.submittedBy?.username || "Непознат"} (
                    {r.submittedBy?.email || "—"})
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        r.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : r.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {r.status === "pending"
                        ? "Чека одобрување"
                        : r.status === "accepted"
                        ? "Прифатено"
                        : "Одбиено"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {r.status === "pending" && (
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-green-500 hover:text-white"
                          onClick={() => handleAction(r._id, "approve")}
                        >
                          <CheckCircle className="mr-1 w-4 h-4" /> Прифати
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-rose-500 hover:text-white"
                          onClick={() => handleAction(r._id, "reject")}
                        >
                          <XCircle className="mr-1 w-4 h-4" /> Одбиј
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
