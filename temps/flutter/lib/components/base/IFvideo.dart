part of '../ui.dart';

calcSeek(config) {
  return GET(config, 'seek') ?? 0;
}

class ChewieVideoWidget extends StatefulWidget {
  final config;

  ChewieVideoWidget(this.config);
  @override
  _ChewieVideoWidgetState createState() => _ChewieVideoWidgetState();
}

class _ChewieVideoWidgetState extends State<ChewieVideoWidget> {
  late VideoPlayerController $video;
  late ChewieController $control;
  bool isInited = false;
  var psid;
  var seekpsid;
  var looppsid;
  var mutedpsid;

  @override
  void initState() {
    super.initState();

    initializePlayer();
  }

  Future<void> initializePlayer() async {
    var config = widget.config;
    var style = config.style;
    var hid = config.hid;
    var clone = config.clone;
    var seek = calcSeek(config);

    bool autoplay = GET(config, 'autoplay') ?? false;

    if (autoplay) {
      if (seek is String) {
        seek = int.tryParse(seek) ?? 0;
      }
    }

    var url = GET(config, 'url');

    $video = url.contains('://') ? VideoPlayerController.network(url) : VideoPlayerController.asset((isWeb ? '' : 'assets/') + url);

    // PS.publish('${hid+clone}-waitingEventProxy', null); flutter The event is inconsistent and will not start for now.

    await $video.initialize();

    Widget controlBar = CupertinoControls(backgroundColor: tfColor('rgba(0,0,0,.6)'), iconColor: Colors.white);
    
    $control = ChewieController(
      videoPlayerController: $video,
      autoPlay: autoplay,
      aspectRatio: style['width'] / style['height'],
      looping: GET(config, 'loop'),
      startAt: seek > 0 ? Duration(seconds: seek) : null,
      customControls: (GET(config, 'controls') ?? true) ? controlBar : Container(
        width: style['width'],
        height: style['height'],
        color: Colors.transparent
      )
    );

    if (GET(config, 'muted') == true) {
      $control.setVolume(0.0);
    }

    bool isPlaying = false;

    $video.addListener(() {
      UPDATE(config, 'seek', $video.value.position.inSeconds, true);
      
      if ($video.value.position == $video.value.duration) {
        isPlaying = false;

        if (GET(config, 'state') != 'ended') {
          PS.publish('${hid+clone}-endedEventProxy', null);
          UPDATE(config, 'state', 'ended');
        }

        return;
      }

      if ($video.value.isPlaying != isPlaying) {
        isPlaying = $video.value.isPlaying;

        if (isPlaying) {
          PS.publish('${hid+clone}-playEventProxy', null);
          UPDATE(config, 'state', 'play');
        } else {
          PS.publish('${hid+clone}-pauseEventProxy', null);
          UPDATE(config, 'state', 'pause');
        }
      }

      if ($video.value.hasError) {
        PS.publish('${hid+clone}-errorEventProxy', null);
        UPDATE(config, 'state', 'error');
      }
      
    });
    
    psid = PS.subscribe('$hid##state.modelchange', (state) {
      if (state == 'play' && isPlaying == false) {
        $video.play();
      }
      if (state == 'pause' && isPlaying == true) {
        $video.pause();
      }
      if (state == 'ended' && isPlaying) {
        $video.seekTo($video.value.duration);

        PS.publish('${hid+clone}-endedEventProxy', null);
      }
    });
    
    seekpsid = PS.subscribe('$hid##seek.modelchange', (p) {
      var sk = p is int ? p : (p is String ? (int.tryParse(p) ?? 0) : 0);

      if (isPlaying) {
        $video.seekTo(Duration(seconds: sk));
      }
    });

    looppsid = PS.subscribe('$hid##loop.modelchange', (p) {
      $video.setLooping(p);
    });

    mutedpsid = PS.subscribe('$hid##muted.modelchange', (p) {
      if (p == true) {
        $control.setVolume(0.0);
      } else {
        $control.setVolume(1.0);
      }
    });

    setState(() {
      isInited = true;
    });
  }

  @override
  void dispose() {
    PS.unsubscribe(psid);
    PS.unsubscribe(seekpsid);
    PS.unsubscribe(looppsid);
    PS.unsubscribe(mutedpsid);
    
    $video.dispose();
    $control.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!isInited) return $padding;

    return Chewie(controller: $control);
  }
}

Map videoCache = {};

final videoMarks = observe('videoMarks', {});

Widget baseVideo(Config config, slo) {
  var style = config.style;

  if (style['backgroundColor'] == null) {
    style['backgroundColor'] = tfColor('#000000');
  }

  var hid = config.hid;
  var clone = config.clone;

  String url = GET(config, 'url') ?? '';
  String controlsStr = GET(config, 'controls').toString();
  String autoplayStr = GET(config, 'autoplay').toString();
  String mark = url + autoplayStr + controlsStr; // Any change is then rendered in full.

  if (url == '') return componentWrap(config, $padding);

  // ignore: unused_local_variable
  var markID = videoMarks.value[hid + clone]; // Responsive redraw variables.

  if (videoCache[hid + clone] != mark) {
    videoCache[hid + clone] = mark;

    setTimeout(() {
      videoMarks.value[hid + clone] = GV.T().toString();
    }, 17);

    return componentWrap(config, $padding);
  }

  Widget tree = ChewieVideoWidget(config);

  return componentWrap(config, tree);
}