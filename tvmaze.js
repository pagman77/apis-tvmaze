"use strict";

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");
const API_URL = "http://api.tvmaze.com";
const DEFAULT_IMG = "https://tinyurl.com/tv-missing";


/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

/** Pull data from server and return array with object
 * [{id:, name:, summary:, image:}] */
async function getShowsByTerm(searchTerm) {

  const apiExt = "/search/shows/";

  const result = await axios.get(
    API_URL + apiExt, { params: { q: searchTerm } });

  const shows = result.data.map(program => {
    const id = program.show.id;
    const name = program.show.name;
    const summary = program.show.summary;
    let image = program.show.image?.medium || DEFAULT_IMG;

    return { id, name, summary, image };
  });

  return shows;
}


/** Given list of shows, create markup for each and to DOM */
function populateShows(shows) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src=${show.image}
              alt="${show.name}"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes"
                data-toggle="modal" data-target="#episodeModal">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }

}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes) */
async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val();
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

/**Extract season list based on show ID
 * return {id: number: numEpisodes: image:} */
async function getSeasonOfShow(show) {

  const result = await axios.get(`${API_URL}/shows/${show}/seasons`);

  const seasons = result.data.map(season => {
    const id = season.id;
    const number = season.number;
    const numEpisodes = season.episodeOrder;
    const image = season.image?.medium || DEFAULT_IMG;

    return { id, number, numEpisodes, image };
  });
  return seasons;
}

/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number } */
async function getEpisodesOfShow(seasons) {
  let episodesBySeason = [];

  for (let season of seasons) {

    const result = await axios.get(`${API_URL}/seasons/${season.id}/episodes`);
    const episodes = result.data.map(episode => {
      const id = episode.id;
      const name = episode.name;
      const number = episode.number;
      return { id, name, number };
    });
    episodesBySeason.push(episodes);
  }
  return episodesBySeason;
}


/** Take array of episode objects, and append to DOM
 * seasons = [{season}, {season}]
 * episodes = [{season} {seasson}]
*/
function populateEpisodes(episodes) {
  $episodesList.empty();

  for (let i = 0; i < episodes.length; i++){
    let $seasonArea1 = $(`
          <div class="accordion-item">
        <h2 class="accordion-header" id="heading-${i+1}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${i+1}" aria-expanded="false" aria-controls="collapse-${i+1}">
            Season ${i+1}
          </button >
        </h2 >
          <div id="collapse-${i+1}" class="accordion-collapse collapse" aria-labelledby="heading-${i+1}" data-bs-parent="#episodesList">
            <div class="accordion-body">
              <ol id=episodesList-${i+1}>`);

      $episodesList.append($seasonArea1);
        for (let episode of episodes[i]){
          let $seasonTarget = $(`#episodesList-${i+1}`)
          let $episode = $(`
              <li id=${episode.id}>
                ${episode.name}
              </li>
          `);
          $seasonTarget.append($episode);
        }
      let $seasonArea2 = $(`
              </ol>
            </div>
          </div>
        </div>
    `)
    $episodesList.append($seasonArea2);
  }

  $episodesArea.show();
}

/** Conductor function to get episode data and append to DOM*/
async function getEpisodesAndDisplay(evt) {
  const showId = $(evt.target).closest(".Show").data("show-id");

  const seasons = await getSeasonOfShow(showId);
  const episodes = await getEpisodesOfShow(seasons); //[[SEASON] {SEASON}]

  populateEpisodes(episodes);
}


$showsList.on("click", ".Show-getEpisodes", getEpisodesAndDisplay);

