'use strict';

var debounce = require('./lib/debounce');
var qs = document.querySelector.bind(document);
var MiloGrid = function(options) {
    if (!options || typeof options !== 'object') {
        throw new Error('Need to add at least a container');
    }
    this.containerEl = qs(options.container);
    this.children = this.containerEl.children;
    this.gridItemMargin = options.margin || 10;
    this.gridItemWidth = options.width || 210;

    this._resizeBind();
};
var MiloGridProto = MiloGrid.prototype;

MiloGridProto._calcTopPosition = function(index) {
    return index >= this.gridColumns ? this.topOffset[index - this.gridColumns] : 0;
};

// to calculate the columns
// get the current available width
// then divide it by gridItem width + gridItem margin
// we are using Math.floor to get the most possible
// amount of columns to fit into the area allocated
MiloGridProto._calcGridColumns = function() {
    this.containerWidth = this.containerEl.clientWidth;
    this.gridColumns = Math.floor((this.containerWidth / (this.gridItemWidth + this.gridItemMargin)));
};

MiloGridProto.buildGrid = function() {
    var idx = 0;
    var imgIdx = 0;
    var length = this.children.length;
    var child;
    var containerHeight = 0;
    var topPosition;
    var images = Array.prototype.slice.call(this.containerEl.querySelectorAll('img'));
    // clean array before each build
    this.topOffset = [];

    this._calcGridColumns();

    var _buildGridIfImagesLoaded = buildGridIfImagesLoaded.bind(this);
    for (imgIdx; imgIdx < images.length; imgIdx++) {
        images[imgIdx].addEventListener('load', _buildGridIfImagesLoaded)
    }

    buildGridIfImagesLoaded.call(this);

    function allImagesLoaded() {
        return images.every(function (image) {
            return image.complete;
        });
    }

    function buildGridIfImagesLoaded() {
        var imgIdx = 0;
        if (!allImagesLoaded()) {
            return;
        }
        for (imgIdx; imgIdx < images.length; imgIdx++) {
            images[imgIdx].removeEventListener('load', _buildGridIfImagesLoaded);
        }
        for (idx; idx < length; idx++) {
            child = this.children[idx];
            topPosition = this._calcTopPosition(idx);
            child.style.cssText =
                'margin:' + this.gridItemMargin / 2 + 'px;' +
                'top:' + topPosition + 'px;' +
                'left:' + (this.gridItemWidth + this.gridItemMargin) * Math.round(idx % this.gridColumns) + 'px;' +
                'width:' + this.gridItemWidth + 'px;';

            this.topOffset.push(child.offsetHeight + this.gridItemMargin + child.offsetTop);
            containerHeight = Math.max(containerHeight, topPosition + child.offsetHeight);
        }
        this.containerEl.style.height = containerHeight + 'px';
    }

};

MiloGridProto._destroyGrid = function() {
    var idx = 0;
    var length = this.children.length;
    for (idx; idx < length; idx++) {
        this.children[idx].style.cssText = '';
    }
};

MiloGridProto._resizeBind = function() {
    var rebuildGrid = function() {
        this.buildGrid();
    }.bind(this);

    // debounce the window resize
    // to minimize the amount of rebuild calls
    window.addEventListener('resize', debounce(rebuildGrid, 600));
};

// expose a public api
var Milo = function(options) {
    var miloGrid = new MiloGrid(options);
    this.buildGrid = miloGrid.buildGrid.bind(miloGrid);
};

module.exports = Milo;