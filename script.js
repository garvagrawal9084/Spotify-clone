let currentSong = new Audio();
let current;
let currFolder;
let song = []; // Initialize the song array

function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";

  // Round to nearest second
  seconds = Math.floor(seconds);

  // Calculate minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Format minutes and seconds with leading zeros if necessary
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  // Return formatted time
  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSong(folder) {
  currFolder = folder;
  let a = await fetch(`http://127.0.0.1:3000/spotify/${folder}`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  let songs = [];
  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split(`/${folder}/`)[1]);
    }
  }

  // Return the fetched songs
  return songs;
}

function updateSongList(songs) {
  let songURL = document
    .querySelector(".songList")
    .getElementsByTagName("ul")[0];
  songURL.innerHTML = ""; // Clear the previous list before adding new songs

  for (const track of songs) {
    const songName = track
      .replaceAll("%20", " ")
      .split(" - ")[1]
      .replace(".mp3", "");
    const songArtist = track
      .replaceAll("%20", " ")
      .split(" - ")[0]
      .replace(".mp3", "");
    songURL.innerHTML += `<li><img src="img/music.svg" alt="">
                            <div class="info">
                                <div class="songName">${songName}</div>
                                <div class="songArtist">${songArtist}</div>
                            </div>
                            <div class="playNow">
                                <img src="img/play2.svg" alt="play">
                                <span>Play Now</span>
                            </div>
                        </li>`;
  }

  // Attach an event listener to each song
  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e, index) => {
    e.addEventListener("click", () => {
      if (songs && songs[index]) {
        current = index;
        playMusic(songs[current]); // Ensure songs[current] is valid before accessing
      } else {
        console.error(`No song found at index ${index}`);
      }
    });
  });
}

function playMusic(track) {
  // console.log(`/spotify/${currFolder}/` + track);
  currentSong.src = `/spotify/${currFolder}/` + track;
  currentSong.play();
  document.getElementById("play").src = "img/pause.svg";
  document.getElementById("songInfo").innerHTML = `${decodeURI(track).replace(
    ".mp3",
    ""
  )}`;
  document.querySelector(".circle").style.left = "0%";
  document.querySelector(".circle").style.transition = "left 0s";
}


async function displayAlbum(){
  let a = await fetch(`http://127.0.0.1:3000/spotify/song/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let cardContainer = document.querySelector(".cardContainer");
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];
    if (e.href.includes("/song")) {
      let folder = e.href.split("/").slice(-2)[0];
      // get the meta data of the folder
      let a = await fetch(
        `http://127.0.0.1:3000/spotify/song/${folder}/info.json`
      );
      let response = await a.json();
      cardContainer.innerHTML += ` <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"
                                fill="none">
                                <circle cx="24" cy="24" r="20" fill="#1fdf64" />
                                <polygon points="20,16 20,32 32,24" fill="#000000" />
                            </svg>

                        </div>
                        <img src="/spotify/song/${folder}/cover.jpg" alt="img">
                        <h3>${response.title}</h3>
                        <p class="font">${response.description}</p>
                    </div>`;
    }
  }

  // Handle album switching
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      // Load new album songs
      song = await getSong(`song/${item.currentTarget.dataset.folder}`);
      updateSongList(song); // Update the song list in the UI
      current = null; // Reset the current song index to the first song
    });
  });
}

async function main() {
  // Get the list of all the songs in the initial album/folder
  song = await getSong("song/liked");
  updateSongList(song);

  displayAlbum()

  // Attach event listener to play , previous , next
  document.getElementById("play").addEventListener("click", () => {
    if (!currentSong.src) {
      play.src = "img/play2.svg";
      return;
    }
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play2.svg";
    }
  });

  // Add event listener to previous button
  document.getElementById("previous").addEventListener("click", () => {
    if (current === 0) {
      playMusic(song[current]);
      return;
    }
    if (currentSong.currentTime > 2) {
      playMusic(song[current]);
    } else {
      current--;
      playMusic(song[current]);
    }
  });

  // Add event listener to next button
  document.getElementById("next").addEventListener("click", () => {
    if (current === null || current >= song.length - 1) {
      return;
    }
    current++;
    playMusic(song[current]);
  });

  // Add event Listener for timeupdate
  currentSong.addEventListener("timeupdate", () => {
    const songTime = document.getElementById("songTime");
    if (songTime) {
      const currentTimeFormatted = formatTime(currentSong.currentTime);
      const durationFormatted = formatTime(currentSong.duration);
      songTime.innerHTML = `${currentTimeFormatted} / ${durationFormatted}`;
    }

    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";
  });

  // Add event Listener on seek bar to play music at a certain point
  document.querySelector(".seekBar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Song change at the end of the song
  currentSong.addEventListener("ended", () => {
    if (current === null || current >= song.length - 1) {
      return;
    }
    current++;
    playMusic(song[current]);
  });

  // Add event listener to hamburger menu
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = 0;
  });

  // Add event listener to close hamburger menu
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-140%";
  });

  // Add volume event Listener
  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    document.getElementById("volume").src =
      currentSong.volume == 0 ? "img/mute.svg" : "img/volume.svg";
  });

  // Add event listener to volume to mute 
  document.querySelector(".volume>img").addEventListener("click" , (e)=>{
    const src = e.target.getAttribute("src");
    const volume = document.querySelector(".range input") ;
    if (src == "img/volume.svg") {
      currentSong.volume = 0;
      e.target.setAttribute("src", "img/mute.svg");
    }else{
      currentSong.volume = volume.value/100;
      e.target.setAttribute("src", "img/volume.svg");
    }
  })

}
main();
