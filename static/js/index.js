window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];

function preloadInterpolationImages() {
    for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
        var path = INTERP_BASE + '/' + String(i).padStart(6, '0') + '.jpg';
        interp_images[i] = new Image();
        interp_images[i].src = path;
    }
}

function setInterpolationImage(i) {
    var image = interp_images[i];
    image.ondragstart = function () {
        return false;
    };
    image.oncontextmenu = function () {
        return false;
    };
    $('#interpolation-image-wrapper').empty().append(image);
}

document.addEventListener("DOMContentLoaded", (event) => {
    var b = document.querySelectorAll('.b-dics');
    b.forEach(element =>
        new Dics({
            container: element,
            textPosition: 'bottom',
            arrayBackgroundColorText: ['#000000', '#000000', '#000000'],
            arrayColorText: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
            linesColor: '#ffffff'
        })
    );

});

$(document).ready(function () {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function () {
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");

    });

    var options = {
        slidesToScroll: 1,
        slidesToShow: 3,
        loop: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 3000,
    }

    // Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);

    // Loop on each carousel initialized
    for (var i = 0; i < carousels.length; i++) {
        // Add listener to  event
        carousels[i].on('before:show', state => {
            console.log(state);
        });
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
        // bulmaCarousel instance is available as element.bulmaCarousel
        element.bulmaCarousel.on('before-show', function (state) {
            console.log(state);
        });
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $('#interpolation-slider').on('input', function (event) {
        setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $('#interpolation-slider').prop('max', NUM_INTERP_FRAMES - 1);

    bulmaSlider.attach();

})

function changeRef(selected) {
    var im1 = document.getElementById("recolor_bonsai")
    var im2 = document.getElementById("recolor_room")
    var im3 = document.getElementById("recolor_horns")
    var im4 = document.getElementById("recolor_trex")
    if (selected.id == 'btn_pnf') {
        im1.src = 'static/comparison_pnf/bonsai/pnf_nosem.png'
        im2.src = 'static/comparison_pnf/room/pnf_nosem.png'
        im3.src = 'static/comparison_pnf/horns/pnf_nosem.png'
        im4.src = 'static/comparison_pnf/trex/pnf_nosem.png'
    }
    if (selected.id == 'btn_pnf_sem') {
        im1.src = 'static/comparison_pnf/bonsai/pnf.png'
        im2.src = 'static/comparison_pnf/room/pnf.png'
        im3.src = 'static/comparison_pnf/horns/pnf.png'
        im4.src = 'static/comparison_pnf/trex/pnf.png'
    }
}

var currentScene = 'horns';
var currentSceneRecolor = 'flower';
var currentSceneRecolorStyle = 'hornswave';

function changeScene(scene, style_base) {
    var activeContainer = document.getElementById(currentScene);
    activeContainer.className = 'is-hidden';

    // reset style for now non-selected
    var activeBtn = document.getElementById("btn_" + currentScene);
    activeBtn.className = 'button-17';

    currentScene = scene;
    //document.write(currentScene)
    var newContainer = document.getElementById(currentScene);
    newContainer.className = '';
    // set style for now selected
    var activeBtn = document.getElementById("btn_" + currentScene);
    activeBtn.className = 'button-17-selected';

    var im_ref = document.getElementById("gif_ref")
    im_ref.src = "static/demo/" + currentScene + '/' + currentScene + ".gif";

    var im = document.getElementById("gif_style");
    im.src = "static/demo/" + currentScene + '/' + style_base + ".gif";

    var circle = document.getElementById(currentScene + '_' + style_base);
    circle.className = "circle-selected";
}

function changeSceneRecolor(scene, style_base) {
    var activeContainer = document.getElementById('rec_' + currentSceneRecolor);
    activeContainer.className = 'is-hidden';

    // reset style for now non-selected
    var activeBtn = document.getElementById("recbtn_" + currentSceneRecolor);
    activeBtn.className = 'button-17';

    currentSceneRecolor = scene;
    //document.write(currentScene)
    var newContainer = document.getElementById('rec_' + currentSceneRecolor);
    newContainer.className = '';
    // set style for now selected
    var activeBtn = document.getElementById("recbtn_" + currentSceneRecolor);
    activeBtn.className = 'button-17-selected';

    var im_ref = document.getElementById("recgif_ref")
    im_ref.src = "static/demo/" + currentSceneRecolor + '/' + currentSceneRecolor + ".gif";

    var im = document.getElementById("recgif_style");
    im.src = "static/demo/" + currentSceneRecolor + '/' + style_base + ".gif";

    var circle = document.getElementById(currentSceneRecolor + '_' + style_base);
    circle.className = "circle-rec-selected";
}

function changeSceneRecolorStyle(scene, style_base) {
    var activeContainer = document.getElementById('rs_' + currentSceneRecolorStyle);
    activeContainer.className = 'is-hidden';

    // reset style for now non-selected
    var activeBtn = document.getElementById("rsbtn_" + currentSceneRecolorStyle);
    activeBtn.className = 'button-17';

    currentSceneRecolorStyle = scene;
    //document.write(currentScene)
    var newContainer = document.getElementById('rs_' + currentSceneRecolorStyle);
    newContainer.className = '';
    // set style for now selected
    var activeBtn = document.getElementById("rsbtn_" + currentSceneRecolorStyle);
    activeBtn.className = 'button-17-selected';

    var im_ref = document.getElementById("rsgif_ref")
    im_ref.src = "static/demo/" + currentSceneRecolorStyle + '/' + currentSceneRecolorStyle + ".gif";

    var im = document.getElementById("rsgif_style");
    im.src = "static/demo/" + currentSceneRecolorStyle + '/' + style_base + ".gif";

    var circle = document.getElementById(currentSceneRecolorStyle + '_' + style_base);
    circle.className = "circle-rs-selected";
}

function changeStyle(i) {
    var b = document.querySelectorAll('.button-17-selected');
    [].forEach.call(b, function (div) {
        // do whatever
        div.className = "button-17";
    });
    i.className = "button-17-selected";

    changeRef(i)
}
const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Content copied to clipboard');
    } catch (err) {
      console.log('Failed to copy: ', err);
    }
  }

  function CopyToClipboard(id)
  {
  var r = document.createRange();
  r.selectNode(document.getElementById(id));
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
  }

function copytoclip() {
    let text = document.getElementById('citation_text').innerText;
        // retire clipboard
        document.getElementById('checkbox1').classList.remove('is-hidden');
        document.getElementById('clipboard1').classList.add('is-hidden');
        document.getElementById('clipboard2').classList.add('is-hidden');

        document.getElementById('clip-copy').blur();

        setTimeout(function(){
            document.getElementById('checkbox1').classList.add('is-hidden');
            document.getElementById('clipboard1').classList.remove('is-hidden');
            document.getElementById('clipboard2').classList.remove('is-hidden');
        }, 2000);
    CopyToClipboard('citation_text')
}

function imgError() {
    alert("Image can't be loaded:\n" + this.src);
  }
function imgLoaded(ev) {
if (--imgCount === 0) {
    document.querySelectorAll(".syncedImage").forEach((img, i) => {
    img.src = images[i];
    });
    }
}

function changePTD(image) {
    var img_ptd = document.getElementById('img_ptd');
    var img_noptd = document.getElementById('img_noptd');

    var btn_image = document.getElementById('btn_ptd_image');
    var btn_sort = document.getElementById('btn_ptd_sort');

    if (image) {
        img_ptd.src = 'static/ptd/ptd_image__.png';
        img_noptd.src = 'static/ptd/noptd_image__.png';

        btn_sort.classList.remove('button-17-selected');
        btn_sort.classList.add('button-17');
        btn_image.classList.remove('button-17');
        btn_image.classList.add('button-17-selected');
    }
    else {
        img_ptd.src = 'static/ptd/ptd.png';
        img_noptd.src = 'static/ptd/noptd.png';

        btn_image.classList.remove('button-17-selected');
        btn_image.classList.add('button-17');
        btn_sort.classList.remove('button-17');
        btn_sort.classList.add('button-17-selected');
    }
}

var videoAttr = { 'autoplay': true, 'loop': true, 'mute': true, 'playsinline': true };
var imgMP4s = Array.prototype.map.call(
  document.querySelectorAll('img[src*=".mp4"]'),
  function(img){

    var src = img.src;
    img.src = null;

    img.addEventListener('error', function(e){
      console.log('MP4 in image not supported. Replacing with video', e); 
      var video = document.createElement('video');

      for (var key in videoAttr) { video.setAttribute(key, videoAttr[key]); }

      for (
        var imgAttr = img.attributes, 
        len = imgAttr.length,
        i = 0; 
        i < len; 
        i++
      ) { 
        video.setAttribute(imgAttr[i].name,  imgAttr[i].value); 
      }

      img.parentNode.insertBefore(video, img);
      img.parentNode.removeChild(img);
    });

    img.src = src;
  });

currentSceneSort = 'bicycle'

function changeSceneSortCull(selected_scene) {

    // get current button
    document.getElementById('btn_' + currentSceneSort + '_sort').classList.remove('button-17-selected')
    document.getElementById('btn_' + currentSceneSort + '_sort').classList.add('button-17')

    currentSceneSort = selected_scene.toLowerCase();
    document.getElementById('btn_' + currentSceneSort + '_sort').classList.remove('button-17')
    document.getElementById('btn_' + currentSceneSort + '_sort').classList.add('button-17-selected')

    document.getElementById('img_sort_gs').src = 'static/sorterror/' + currentSceneSort +'_3dgs.png';
    document.getElementById('img_sort_ours').src = 'static/sorterror/' + currentSceneSort +'_ours.png';
    document.getElementById('img_culling').src = 'static/culling/' + currentSceneSort +'_culling.png';
    document.getElementById('img_noculling').src = 'static/culling/' + currentSceneSort +'_noculling.png';
}

function changeCulling(tile) {
    var img_noculling = document.getElementById('img_noculling');
    var img_culling = document.getElementById('img_culling');

    var btn_pixel = document.getElementById('btn_culling_pixel');
    var btn_tile = document.getElementById('btn_culling_tile');

    if (tile) {
        img_culling.src = 'static/culling/culling_tile.png';
        img_noculling.src = 'static/culling/noculling_tile.png';

        btn_pixel.classList.remove('button-17-selected');
        btn_pixel.classList.add('button-17');
        btn_tile.classList.remove('button-17');
        btn_tile.classList.add('button-17-selected');
    }
    else {
        img_culling.src = 'static/culling/culling_pixel.png';
        img_noculling.src = 'static/culling/noculling_pixel.png';

        btn_tile.classList.remove('button-17-selected');
        btn_tile.classList.add('button-17');
        btn_pixel.classList.remove('button-17');
        btn_pixel.classList.add('button-17-selected');
    }
}

function changeGIF(style_image, image) {
    var b = document.querySelectorAll('.circle-selected');
    [].forEach.call(b, function (div) {
        // do whatever
        div.className = "circle";
    });
    image.className = "circle-selected";
    var im = document.getElementById("gif_style")
    var im_ref = document.getElementById("gif_ref")

    let images = [
        "static/demo/" + currentScene + '/' + style_image + ".gif",
        im_ref.src
    ]

    whereto = [
        im,
        im_ref
    ]

    images.forEach(function (value, i) {
        whereto[i].src = value;
    });
}

function changeGIFrecolor(color, image) {
    var b = document.querySelectorAll('.circle-rec-selected');
    [].forEach.call(b, function (div) {
        // do whatever
        div.className = "circle-rec";
    });
    image.className = "circle-rec-selected";
    var im = document.getElementById("recgif_style")
    var im_ref = document.getElementById("recgif_ref")
    im.src = "static/demo/" + currentSceneRecolor + '/' + color + ".gif";
    im_ref.src = im_ref.src;
}

function changeGIFrecolorstyle(color, image) {
    var b = document.querySelectorAll('.circle-rs-selected');
    [].forEach.call(b, function (div) {
        // do whatever
        div.className = "circle-rs";
    });
    image.className = "circle-rs-selected";
    var im = document.getElementById("rsgif_style")
    var im_ref = document.getElementById("rsgif_ref")
    im.src = "static/demo/" + currentSceneRecolorStyle + '/' + color + ".gif";
    im_ref.src = im_ref.src;
}