/**
 * Plays a sound and waits for it to finish.
 * Uses the manual Playback resource creation pattern to ensure events work.
 * @param {Object} ari - The ARI client instance
 * @param {Object} channel - The channel to play sound on
 * @param {string} soundName - The name of the sound file
 */
function playSound(ari, channel, soundName) {
    return new Promise((resolve, reject) => {
        // 1. Create the Playback instance manually
        let playback = ari.Playback();

        // 2. Set up the listener BEFORE playing (to be safe)
        playback.on("PlaybackFinished", function (event, completedPlayback) {
            // Cleanup: remove listener to avoid memory leaks
            playback.removeAllListeners("PlaybackFinished");
            resolve();
        });
        console.log(`Playing sound: ${soundName}`);
        // 3. Play the sound using that specific playback instance
        channel.play(
            { media: `sound:${soundName}` },
            playback,
            function (err, newPlayback) {
                if (err) {
                    console.error(`❌ Error playing '${soundName}':`, err.message);
                    // We resolve anyway so the IVR doesn't get stuck hanging
                    resolve();
                }
            }
        );
    });
}

module.exports = {
    playSound,
};
