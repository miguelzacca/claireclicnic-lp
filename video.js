export function prepareMovie(video, frameRate, setReady) {
  let source = "";
  let progress = 0;
  let seekTimeout;
  let broken = false;

  function fail() {
    if (!source || !video.hasAttribute("src")) return;
    clearTimeout(seekTimeout);
    broken = true;
    setReady(false);
    video.removeAttribute("src");
    video.load();
  }

  function seek() {
    if (!source || broken || video.seeking || !video.seekable.length || !Number.isFinite(video.duration)) return;

    const lastFrame = Math.max(0, Math.round(video.duration * frameRate) - 1);
    const wantedFrame = Math.round(progress * lastFrame);
    // Aim inside the frame interval so decoder rounding cannot select the preceding sample.
    const time = wantedFrame === 0 ? 0 : (wantedFrame + .5) / frameRate;
    if (Math.abs(video.currentTime - time) >= .5 / frameRate) {
      clearTimeout(seekTimeout);
      seekTimeout = setTimeout(fail, 2800);
      video.currentTime = time;
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setReady(true);
    }
  }

  video.addEventListener("loadeddata", seek);
  video.addEventListener("progress", seek);
  video.addEventListener("seeked", () => {
    clearTimeout(seekTimeout);
    seek();
  });
  video.addEventListener("error", fail);

  return {
    setSource(nextSource) {
      if (nextSource === source) return;
      clearTimeout(seekTimeout);
      source = nextSource;
      broken = false;
      setReady(false);
      video.preload = source ? "auto" : "none";
      if (source) {
        video.src = source;
      } else if (video.hasAttribute("src")) {
        video.removeAttribute("src");
        video.load();
      }
    },
    render(nextProgress) {
      if (nextProgress === progress) return;
      progress = nextProgress;
      seek();
    },
  };
}
