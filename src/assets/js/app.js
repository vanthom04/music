const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const app = (() => {
    const playlist = $('.playlist');
    const wrapper = $('.wrapper');
    const showBtn = $('.btn-show-list-music');
    const nameSong = $('.header h2');
    const artistSong = $('.header h3');
    const imgSong = $('.box-img');
    const playBtn = $('.btn-play');
    const nextBtn = $('.btn-next');
    const prevBtn = $('.btn-prev');
    const progress = $('.progress');
    const progressBar = $('.progress-bar');
    const controls = $('.controls');
    const myControlBtn = $('.btn-my-controls');
    const iconMyControl = $('#icon-my-control');
    const playbackTimeBtn = $('.btn-playback-time');
    const playbackTimer = $('.playback-timer')
    const playbackTimeIcon = $('.btn-playback-time i');
    const slider = $('.slider');
    const volumeChange = $('#volume-change');
    const prevVolume = $('#prev-volume');
    const nextVolume = $('#next-volume');

    let audio = document.createElement('audio');

    let currentIndex = 0;
    let isPlaying = false;
    let isShow = false;
    let isRandom = false;
    let isRepeat = false;
    let isPlaybackTime = false;
    let stopTime = 3600;
    let countdown = null;
    let stopSong = null;

    let songsPlayed = [];

    return {
        padStart(value, length) {
            return String(value).padStart(length, '0');
        },
        render(songs) {
            for (let i = 0; i < songs.length; i++) {
                let song = `
                    <div class="song ${i === this.currentIndex ? "active" : ""}" data-index="${i}">
                        <div class="total">
                            <span>${i+1}</span>
                            <i class="fa-solid fa-play"></i>
                        </div>
                        <div class="song-img" style="background: url(${songs[i].thumbnail}) no-repeat;"></div>
                        <div class="title">
                            <div class="name">${songs[i].name}</div>
                            <div class="artist">${songs[i].artist}</div>
                        </div>
                        <audio class="${songs[i].idMusic}" src="${songs[i].pathAudio}"></audio>
                        <div id="${songs[i].idMusic}" class="option">00:00</div>
                    </div>
                `;
                playlist.insertAdjacentHTML('beforeend', song);
                const songTag = $(`#${songs[i].idMusic}`);
                const songDuration = $(`.${songs[i].idMusic}`);
                songDuration.addEventListener('loadeddata', () => {
                    let duration = songDuration.duration;
                    let min = Math.floor(duration / 60);
                    let sec = Math.floor(duration % 60);
                    songTag.innerText = `${this.padStart(min, 2)}:${this.padStart(sec, 2)}`;
                });
            }
        },
        handleEvent(songs) {
            // show playlist
            showBtn.onclick = () => {
                const iconShowList = $('#icon-show-list');
                const showPlaylist = $('.show-playlist');
                const showMusic = $('.show-music');
                if (!isShow) {
                    isShow = !isShow;
                    iconShowList.classList.remove('fa-bars');
                    iconShowList.classList.add('fa-house');
                    showPlaylist.classList.add('active');
                    showMusic.classList.remove('active');
                    wrapper.classList.add('active');
                } else {
                    isShow = !isShow;
                    iconShowList.classList.remove('fa-house');
                    iconShowList.classList.add('fa-bars');
                    showPlaylist.classList.remove('active');
                    showMusic.classList.add('active');
                    wrapper.classList.remove('active');
                }
            };
            // move
            if (this.detectDeviceType() === 'Mobile') {
                let startX, endX;
                wrapper.addEventListener('touchstart', (e) => {
                    startX = e.touches[0].clientX;
                });
                wrapper.addEventListener('touchmove', (e) => {
                    endX = e.touches[0].clientX;
                });
                wrapper.addEventListener('touchend', () => {
                    const distanceX = endX - startX;
                    if (distanceX > 100 && !wrapper.classList.contains('active')) {
                        showBtn.click();
                    }
                    if (distanceX < -100 && wrapper.classList.contains('active')) {
                        showBtn.click();
                    }
                });
            }
            window.onload = () => {
                this.render(songs);
                this.loadCurrentSong(songs);
            }
            // Play song
            playBtn.onclick = () => !isPlaying ? this.playSong() : this.pauseSong();
            // Prev song
            prevBtn.onclick = () => this.prevSong(songs);
            // Next song
            nextBtn.onclick = () => this.nextSong(songs);
            // xu ly khi ket thuc song
            audio.onended = () => isRepeat ? audio.play() : this.nextSong(songs);
            // xu ly random song && repeat
            myControlBtn.onclick = () => {
                let clearActiveControls = setTimeout(() => {
                    controls.classList.remove('active');
                }, 1500);
                if (iconMyControl.classList.contains('fa-shuffle') && !iconMyControl.classList.contains('pink')) {
                    isRandom = !isRandom;
                    iconMyControl.classList.add('pink');
                    if (controls.classList.contains('active')) {
                        clearTimeout(clearActiveControls)
                    }
                    controls.classList.add('active');
                    controls.setAttribute('msg', 'Phát ngẫu nhiên');
                    clearActiveControls;
                } else if (iconMyControl.classList.contains('fa-shuffle') && iconMyControl.classList.contains('pink')) {
                    isRandom = !isRandom;
                    isRepeat = !isRepeat;
                    iconMyControl.classList.remove('fa-shuffle');
                    iconMyControl.classList.add('fa-repeat');
                    if (controls.classList.contains('active')) {
                        clearTimeout(clearActiveControls)
                    }
                    controls.classList.add('active');
                    controls.setAttribute('msg', 'Lặp lại bài hiện tại');
                    clearActiveControls;
                } else {
                    isRepeat = !isRepeat;
                    iconMyControl.classList.remove('fa-repeat');
                    iconMyControl.classList.remove('pink');
                    iconMyControl.classList.add('fa-shuffle');
                    clearTimeout(clearActiveControls)
                }
            };
            // 
            playbackTimeBtn.onclick = () => this.playBackTime();
            // progress
            audio.ontimeupdate = (e) => {
                let currentTimeAudio = e.target.currentTime;
                let durationTimeAudio = e.target.duration;
                let progressWidth = (currentTimeAudio / durationTimeAudio) * 100;
                progressBar.style.width = `${progressWidth}%`;
                // current time song audio
                const currentTime = $('.current');
                let curMin =  Math.floor(currentTimeAudio / 60);
                let curSec =  Math.floor(currentTimeAudio % 60);
                currentTime.innerText = `${this.padStart(curMin, 2)}:${this.padStart(curSec, 2)}`;
            }
            // Handle click progress
            progress.onclick = (e) => {
                let clickOffSetX = e.offsetX;
                let songDuration = audio.duration;
                let progressWidthVal = progress.clientWidth;
                audio.currentTime = (clickOffSetX / progressWidthVal) * songDuration;
                this.playSong();
            }
            playlist.onclick = (e) => {
                const clickedSong = e.target.closest('.song');
                const songNode = e.target.closest('.song:not(.active)');
                const activeSong = $('.song.active');
                if (songNode) {
                    if (!clickedSong) return;
                    if (activeSong) activeSong.classList.remove('active');                    
                    songNode.classList.add('active');
                    currentIndex = Number(songNode.dataset.index);
                    this.loadCurrentSong(songs);
                    this.playSong();
                }
            }
            // xy ly khi click keydown
            window.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'k') {
                    e.preventDefault();
                playBtn.click();
                } else if (e.key === 'j' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    prevBtn.click();
                } else if (e.key === 'l' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    nextBtn.click();
                } else if (e.key === 'Tab' || e.key === 'Backspace') {
                    e.preventDefault();
                    showBtn.click();
                } else if (e.key === 'h') {
                    e.preventDefault();
                    myControlBtn.click();
                } else if (e.key === ';') {
                    e.preventDefault();
                    playbackTimeBtn.click();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    prevVolume.click();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    nextVolume.click();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    audio.currentTime = 0;
                } else if (e.key === 'End') {
                    e.preventDefault();
                    audio.currentTime = audio.duration;
                }
            });
        },
        setActiveSong() {
            const allSong = $$('.song');
            const activeSong = $('.song.active');
            if (activeSong) activeSong.classList.remove('active');
            allSong[currentIndex].classList.add('active');
        },
        scrollToActiveSong() {
            setTimeout(() => {
                const activeSong =$('.song.active');
                if (activeSong) {
                    activeSong.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                    });
                }
            }, 300);
        },
        loadCurrentSong(songs) {
            nameSong.innerText = songs[currentIndex].name;
            artistSong.innerText = songs[currentIndex].artist;
            imgSong.style.backgroundImage = `url("${songs[currentIndex].thumbnail}")`;
            audio.src = songs[currentIndex].pathAudio;
            audio.load();
            document.title = `${songs[currentIndex].name} - ${songs[currentIndex].artist}`
            // duration time song audio
            audio.addEventListener('loadeddata', () => {
                const durationTime = $('.duration');
                let duration = audio.duration;
                let durMin = Math.floor(duration / 60);
                let durSec = Math.floor(duration % 60);
                durationTime.innerText = `${this.padStart(durMin, 2)}:${this.padStart(durSec, 2)}`;
            });
        },
        playSong() {
            isPlaying = true;
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            if (audio.readyState >= 3) {
                audio.play();
            } else {
                audio.onloadeddata = () => audio.play();
            }
        },
        pauseSong() {
            isPlaying = false;
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            audio.pause();
        },
        nextSong(songs) {
            currentIndex++;
            if (isRandom) {
                currentIndex = this.randomSong(songs);
            } else if (currentIndex > songs.length - 1) {
                currentIndex = 0;
            }
            this.loadCurrentSong(songs);
            this.playSong();
            this.setActiveSong(currentIndex);
            this.scrollToActiveSong();
        },
        prevSong(songs) {
            currentIndex--;
            if (isRandom) {
                currentIndex = this.randomSong(songs);
            } else if (currentIndex < 0) {
                currentIndex = songs.length - 1;
            }
            this.loadCurrentSong(songs);
            this.playSong();
            this.setActiveSong(currentIndex);
            this.scrollToActiveSong();
        },
        randomSong(songs) {
            let randomIndex;
            let randomIndexSong;
            do {
                randomIndex = Math.floor(Math.random() * songs.length);
                randomIndexSong = songs[randomIndex];
            } while (songsPlayed.includes(randomIndexSong));
            songsPlayed.push(randomIndexSong);
            if (songsPlayed.length === songs.length) {
                songsPlayed = [];
            }
            return randomIndex;
        },
        playBackTime() {
            if (!isPlaybackTime) {
                isPlaybackTime = true;
                playbackTimeIcon.classList.add('pink');
                playbackTimer.classList.add('show');
                let min = Math.floor(stopTime / 60);
                let sec = Math.floor(stopTime % 60);
                playbackTimer.innerText = `${this.padStart(min, 2)}:${this.padStart(sec, 2)}`;
                this.countdown = setInterval(() => {
                    if (sec === 0) {
                        min--;
                        sec = 59;
                    } else {
                        sec--;
                    }
                    playbackTimer.innerText = `${this.padStart(min, 2)}:${this.padStart(sec, 2)}`;
                }, 1000);
                stopSong = setTimeout(() => {
                    isPlaybackTime = false;
                    playbackTimeIcon.classList.remove('pink');
                    playbackTimer.classList.remove('show');
                    this.pauseSong();
                    clearInterval(countdown);
                }, stopTime * 1000);
            } else {
                isPlaybackTime = false;
                playbackTimeIcon.classList.remove('pink');
                playbackTimer.classList.remove('show');
                clearInterval(countdown);
                clearTimeout(stopSong);
            }
        },
        volumeChange() {
            let normalVolume = volumeChange.getAttribute('value');
            if (this.detectDeviceType() === 'Mobile') {
                audio.volume = 1;
            } else {
                audio.volume = normalVolume / 100;
            }
            volumeChange.addEventListener('change', (e) => {
                audio.volume = e.target.value / 100;
                slider.classList.add('active');
                slider.setAttribute('volume', volumeChange.value);
                if (slider.classList.contains('active')) {
                    setTimeout(removeActiveSlider, 2000);
                }
            });
            prevVolume.addEventListener('click', () => {
                volumeChange.value--;
                audio.volume = volumeChange.value / 100;
                slider.classList.add('active');
                slider.setAttribute('volume', volumeChange.value);
                if (volumeChange.value === 100) {
                    prevVolume.setAttribute('disabled', 'true');
                }
                if (slider.classList.contains('active')) {
                    setTimeout(removeActiveSlider, 2000);
                }
            });
            nextVolume.addEventListener('click', () => {
                volumeChange.value++;
                audio.volume = volumeChange.value / 100;
                slider.classList.add('active');
                slider.setAttribute('volume', volumeChange.value);
                if (volumeChange.value === 100) {
                    nextVolume.setAttribute('disabled', 'true');
                }
                if (slider.classList.contains('active')) {
                    setTimeout(removeActiveSlider, 2000);
                }
            });
            function removeActiveSlider() {
                slider.classList.remove('active');
            }
        },
        detectDeviceType() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                ? 'Mobile'
                : 'Desktop';
        },
        start(songs) {
            this.loadCurrentSong(songs);
            this.handleEvent(songs);
            this.volumeChange();
        }
    }
})();

export default app;
