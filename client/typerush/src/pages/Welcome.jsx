import Layout from "../components/Layout";

export default function Welcome() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-screen px-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-8 shadow-xl max-w-md text-center">
          <h1 className="text-3xl font-bold text-imperial dark:text-gold mb-4">
            Fast Geography
          </h1>
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
            alt="Globe"
            className="rounded-xl shadow-lg"
          />
        </div>
      </div>
    </Layout>
  );
}
