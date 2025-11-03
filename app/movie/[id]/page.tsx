import MoviePoster from "@/components/MoviePoster";
import db from "@/db";
import { Movie, SimilarMovie } from "@/types";
import Image from "next/image";
import { notFound } from "next/navigation";

// refresh cache every 24 hours
export const revalidate = 60 * 60 * 24;


async function MoviePage({
  params, 
}: {
  params: Promise<{ id: string }>; 
}) {
  const { id } = await params;

  const movies = db.collection("movies");

  // 1) Fetch the movie AND ensure we include the vector
  const cursor = await movies.find(
    { _id: id },
    {
      // Only include what you use + the vector
      projection: {
        Title: 1,
        Poster: 1,
        Genre: 1,
        Director: 1,
        Actors: 1,
        BoxOffice: 1,
        Released: 1,
        Runtime: 1,
        Rated: 1,
        imdbRating: 1,
        Language: 1,
        Country: 1,
        $vectorize: 1,
        $vector: 1, // <- IMPORTANT
      },
      limit: 1,
    }
  );

  if (!(await cursor.hasNext())) return notFound();

  const movie = (await cursor.next()) as Movie & { $vector?: number[] };


  // 2) Similar by vector, exclude the same _id, include similarity
  const similarMovies = (await movies
    .find(
      {},
      {
        vector: movie.$vector,
        limit: 6, // we will cut the first movie and want to show 5 similar movies
        includeSimilarity: true,
      }
    )
    .toArray()) as SimilarMovie[];

    similarMovies.shift();

  return (
    <div>
      <div className="flex flex-col md:flex-row items-center gap-y-10 p-10 pb-0">
        <Image
          src={movie.Poster}
          alt={movie.Title}
          width={300}
          height={450}
          className="shrink-0 rounded-lg "
        />
        <div className="px-2 md:px-10 flex flex-col gap-y-2">
          <h1 className="text-6xl font-bold">{movie.Title}</h1>
          <p className="text-gray-600">{movie.Genre}</p>
          <p className="font-light">{movie.$vectorize}</p>

          <div className="mt-auto grid grid-cols-2">
            <div className="font-semibold">
              <p>Directed by</p>
              <p>Featuring</p>
              <p>Box Office:</p>
              <p>Released:</p>
              <p>Runtime:</p>
              <p>Rated:</p>
              <p>IMDB Rating:</p>
              <p>Language:</p>
              <p>Country:</p>
            </div>
            <div>
              <p>{movie.Director}</p>
              <p>{movie.Actors}</p>
              <p>{movie.BoxOffice}</p>
              <p>{movie.Released}</p>
              <p>{movie.Runtime}</p>
              <p>{movie.Rated}</p>
              <p>{movie.imdbRating}</p>
              <p>{movie.Language}</p>
              <p>{movie.Country}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-3xl pt-10 pl-10 font-bold">Similar Films you may like</h2>
        <div className="flex justify-between items-center lg:flex-row gap-x-20 gap-y-10 pl-20 pr-10 py-10 overflow-x-scroll">
          {similarMovies.map((m, i) => {
            const simPct =
              typeof m.$similarity === "number"
                ? Math.round(m.$similarity * 100) // guard against undefined
                : undefined;

            return (
              <MoviePoster
                key={m._id}
                index={i + 1}
                similarityRating={simPct} // your component should handle undefined gracefully
                movie={m}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MoviePage;
