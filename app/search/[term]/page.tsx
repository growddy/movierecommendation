import MoviePoster from "@/components/MoviePoster";
import db from "@/db";
import { Movie } from "@/types";

// refresh cache every 24 hours
export const revalidate = 60 * 60 * 24;

async function SearchTerm({
  params, 
}: { 
  params: Promise<{ term: string }>;
 }) {
  const { term } = await params;
  const q = decodeURIComponent(term);
  const movies = db.collection("movies");

  const similarMovies = (await movies
    .find(
      {},
      {
        vectorize: q,          // <- semantic search FROM the text query
        includeSimilarity: true, // helpful during dev
        limit: 12,
        projection: { $vector: 0 }, // keep payload lean
      }
    )
    .toArray()) as Movie[];

  return (
    <div className="flex flex-col items-center justify-center p-20 pt-10">
      <h1 className="mb-10 text-xl text-gray-100">
        Suggested results based on your search
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {similarMovies.map((movie, i) => (
          <div key={movie._id} className="flex space-x-2 relative">
            <p className="absolute flex items-center justify-center left-4 top-2 text-white font-extrabold text-xl z-40 rounded-full bg-indigo-500/80 w-10 h-10">
              {i + 1}
            </p>

            <MoviePoster movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchTerm;
