/**
 * Handles audio format fallbacks for cross-platform compatibility
 */
class AudioFormatHandler {
  constructor() {
    this.supportedFormats = null;
  }

  /**
   * Detects which audio formats are supported by the current browser
   * @returns {Object} Object with format support information
   */
  detectSupportedFormats() {
    if (this.supportedFormats) return this.supportedFormats;
    
    const audio = document.createElement('audio');
    this.supportedFormats = {
      mp3: audio.canPlayType('audio/mpeg').replace(/no/, ''),
      ogg: audio.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, ''),
      wav: audio.canPlayType('audio/wav; codecs="1"').replace(/no/, ''),
      aac: audio.canPlayType('audio/aac').replace(/no/, ''),
      m4a: audio.canPlayType('audio/x-m4a').replace(/no/, ''),
      flac: audio.canPlayType('audio/flac').replace(/no/, '')
    };
    
    console.log('Detected audio format support:', this.supportedFormats);
    return this.supportedFormats;
  }

  /**
   * Gets the base path without extension
   * @param {string} path - File path with extension
   * @returns {string} Path without extension
   */
  getBasePath(path) {
    return path.replace(/\.[^/.]+$/, '');
  }

  /**
   * Loads audio with format fallbacks
   * @param {HTMLAudioElement} audioElement - The audio element to use
   * @param {string} originalSrc - Original audio source path
   * @returns {Promise} Promise that resolves when audio is loaded or rejects if all formats fail
   */
  loadWithFallback(audioElement, originalSrc) {
    return new Promise((resolve, reject) => {
      const formats = this.detectSupportedFormats();
      const basePath = this.getBasePath(originalSrc);
      
      // Prioritize formats that are supported by this browser
      const formatPriority = ['mp3', 'aac', 'm4a', 'ogg', 'wav', 'flac'];
      const attemptedSources = [];
      
      let currentIndex = 0;
      
      const tryNextFormat = () => {
        if (currentIndex >= formatPriority.length) {
          console.error('All audio formats failed:', attemptedSources);
          reject(new Error(`No supported audio format found for ${basePath}`));
          return;
        }
        
        const format = formatPriority[currentIndex];
        currentIndex++;
        
        // Skip formats not supported by this browser
        if (!formats[format]) {
          console.log(`Format ${format} not supported by browser, skipping`);
          tryNextFormat();
          return;
        }
        
        const source = `${basePath}.${format}`;
        attemptedSources.push(source);
        
        console.log(`Attempting to play: ${source}`);
        
        const handleError = () => {
          console.log(`Format ${format} failed to load`);
          audioElement.removeEventListener('error', handleError);
          audioElement.removeEventListener('loadeddata', handleSuccess);
          tryNextFormat();
        };
        
        const handleSuccess = () => {
          console.log(`Successfully loaded ${format} format`);
          audioElement.removeEventListener('error', handleError);
          audioElement.removeEventListener('loadeddata', handleSuccess);
          resolve(format);
        };
        
        audioElement.addEventListener('error', handleError);
        audioElement.addEventListener('loadeddata', handleSuccess);
        
        audioElement.src = source;
        audioElement.load();
      };
      
      tryNextFormat();
    });
  }
}

// Create a singleton instance
window.audioFormatHandler = new AudioFormatHandler();