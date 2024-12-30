
#### The DelugeWeb project is still in its early stages. At this writing, we have:

* vuefinder - which uses USB Midi connections to browse (and upload and download) stuff from the Deluge SD card.
* delugeclient - a simple web application for getting debug info from the Deluge. Not updated recently.
* catnip - a web application for displaying debug information. Also not active.
* downrush/waverly - a program for editing .WAV files using an old version of WaveSurfer.
* downrush/viewScore - a program for viewing Deluge XML files such as KIT, SYNTH, and SONG.
    downrush stuff runs mostly, but has not been updated to show new Community Edition features.

#### How to build DelugeWeb projects:

1) Install the Node Package Manager (npm).
2) checkout the complete DelugeWeb repository.
   ```git
   git clone https://github.com/SynthstromAudible/DelugeWeb.git
     ```
3) change to the DelugeWeb directory.
4) for each subproject of interest, change to the directory for that project. Example: ```cd vuefinder```.
5) Install the dependencies for the given subproject by entering ``npm install``
6) Build the project for development by entering ``npm run dev``
7) Make sure your Deluge is running a recent build that has Web SysEx support running and is connected to your computer via USB. Check and make sure using another Midi-capable program like Ableton Live.
8) Go to the web browser (Chrome recommended) and visit the URL: ``http://localhost:5173`` (or whatever the npm run dev command says).
9) Press the "home" icon which should cause the SD card contents to be displayed (at the root level).

We generally use vite to coordinate the compilation and execution of our web apps. You can use ``npm run build`` to create a build file to upload to a hosting provider.

You can test your application under the https "secure" browser scheme by changing the following lines to not be commented-out:

```
	/* uncomment this block to enable https. You may need to change some settings so this will actually work in Chrome.
		server: {
	  port: 8000,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    },
  },
  	preview: {
	  port: 8000,
    https: {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/certificate.pem'),
    },
  },
 */
```

#### A Note on https:

There are a few features, like using the microphone to input samples, that require running from a "secure context". They don't want people turning on your camera or microphone without asking.

Chrome, like most other browsers, does not want you to open locally hosted content as "secure content", and must be told how to enable this. The "How To" do this keeps changing and many of the online instructions are wrong. I had to take the 'certificate.pem' and import that into the MacOS key-ring. This is another process that keeps changing and most of the online instructions are wrong. There may also be a browser setting somewhere that you need to change.

I am not giving specific instructions on how to cope with this, because I tried so many things trying to get this to work that I don't remember which magic incantations actually accomplished anything. You are on your own.

You should be able to get most everything done without turning https on. If you find something that requires testing under https, you may be better off just uploading the stuff in the build directory to a hosting provider.
