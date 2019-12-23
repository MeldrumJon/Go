# Go

Play the ancient Chinese board game [Go](https://en.wikipedia.org/wiki/Go_(game)). Built using a [modified version](https://github.com/MeldrumJon/weiqi.js) of [weiqi.js](https://github.com/cjlarose/weiqi.js).  Added the ability to play against players across the internet using [PeerJS](https://github.com/peers/peerjs).

## Testing Locally

1. Install [Node's](https://nodejs.org/en/) http-server package:
```
sudo npm install http-server -g
```
2. Run `http-server -c-1 [path]` where `[path]` points to this folder.
3. Open localhost:8080 in the browser.

## Aesthetics

Wood texture based on [JCW's Wood texture at OpenGameArt.com](https://opengameart.org/content/wood-texture-tiles).

Move sound created from [KaterinaGalasova's board game sounds](https://freesound.org/people/KaterinaGalasova/sounds/461931/). Pass sound created from [sqeeeek's short bell sound](https://freesound.org/people/sqeeeek/sounds/237106/).
  
## License

This project's source code is licensed under [MIT license](./LICENSE). Images in the `res` directory are licensed under the [Creative Commons 0 License](https://creativecommons.org/publicdomain/zero/1.0/). [PeerJS](https://github.com/peers/peerjs) is licensed under the [MIT license](https://tldrlegal.com/license/mit-license). [Weiqi.js](https://github.com/cjlarose/weiqi.js) is licensed under the [ISC license](https://github.com/cjlarose/weiqi.js/blob/master/LICENSE-ISC.txt).
