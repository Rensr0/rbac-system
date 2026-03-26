/**
 * core.js v3.1 - 核心请求库 + 权限工具 + 通用 UI 组件
 * 重构：全局变量迁移到 UI 命名空间
 */
var API = (function () {
  var path = window.location.pathname;
  var BASE = path.indexOf('/pages/') !== -1 ? '../api' : 'api';

  function redirectToLogin() {
    if (window.location.pathname.indexOf('index.html') !== -1 ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/')) {
      return;
    }
    Storage.remove('currentUser');
    var loginUrl = window.location.pathname.indexOf('/pages/') !== -1
      ? '../index.html'
      : 'index.html';
    window.location.href = loginUrl;
  }

  function request(url, options) {
    options = options || {};
    var method = options.method || 'GET';
    var data = options.data || null;
    var params = options.params || {};
    var raw = options.raw || false;

    var fullUrl = BASE + '/' + url;
    var queryStr = Object.entries(params)
      .filter(function (pair) { return pair[1] !== null && pair[1] !== undefined && pair[1] !== ''; })
      .map(function (pair) { return encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]); })
      .join('&');
    if (queryStr) fullUrl += '?' + queryStr;

    var fetchOptions = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (data && method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }

    return fetch(fullUrl, fetchOptions)
      .then(function (res) {
        if (res.status === 401) {
          if (!raw) redirectToLogin();
          return { code: 401, msg: '登录已过期', data: null };
        }
        var contentType = res.headers.get('content-type') || '';
        if (contentType.indexOf('application/json') === -1) {
          return res.text().then(function (html) {
            console.error('API 返回非 JSON:', html.substring(0, 200));
            return { code: 500, msg: '服务器返回了异常内容', data: null };
          });
        }
        return res.json().then(function (json) {
          if (json.code === 401 && !raw) {
            redirectToLogin();
          }
          return json;
        });
      })
      .catch(function (err) {
        console.error('API Error:', err);
        var msg = '网络请求失败，请检查网络连接';
        if (!navigator.onLine) {
          msg = '网络已断开，请检查网络连接';
        } else if (err.message && err.message.indexOf('Failed to fetch') !== -1) {
          msg = '无法连接到服务器，请稍后重试';
        }
        if (!raw) {
          UI.toast(msg, 3000);
        }
        return { code: 500, msg: msg, data: null };
      });
  }

  return {
    base: BASE,
    get: function (url, params, opts) {
      var options = { method: 'GET', params: params };
      if (opts) { options.raw = opts.raw; }
      return request(url, options);
    },
    post: function (url, data) { return request(url, { method: 'POST', data: data }); },
    put: function (url, data) { return request(url, { method: 'PUT', data: data }); },
    del: function (url, data) { return request(url, { method: 'DELETE', data: data }); },
    raw: function (url, params) { return request(url, { method: 'GET', params: params, raw: true }); },
  };
})();

var UI = (function () {
  'use strict';

  function showToast(msg, duration) {
    duration = duration || 2000;
    var container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, duration);
  }

  function appToast(msg, duration) {
    duration = duration || 2000;
    var toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, duration);
  }

  function showLoading() {
    var mask = document.querySelector('.loading-mask');
    if (!mask) {
      mask = document.createElement('div');
      mask.className = 'loading-mask';
      mask.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(mask);
    }
    mask.classList.add('show');
  }

  function hideLoading() {
    var mask = document.querySelector('.loading-mask');
    if (mask) mask.classList.remove('show');
  }

  function appShowLoading() {
    var el = document.querySelector('.app-loading');
    if (!el) {
      el = document.createElement('div');
      el.className = 'app-loading';
      el.innerHTML = '<div class="app-loading-inner"><div class="loading-spinner"></div></div>';
      document.body.appendChild(el);
    }
    el.classList.add('show');
  }

  function appHideLoading() {
    var el = document.querySelector('.app-loading');
    if (el) el.classList.remove('show');
  }

  function confirmDialog(title, content) {
    return new Promise(function (resolve) {
      var isMobileDevice = window.innerWidth <= 768;
      var overlay = document.createElement('div');

      if (isMobileDevice) {
        overlay.className = 'app-dialog-overlay show';
        overlay.innerHTML =
          '<div class="app-dialog">'
          + '<div class="dialog-title">' + title + '</div>'
          + '<div class="dialog-content">' + content + '</div>'
          + '<div class="dialog-actions">'
          + '<button class="dialog-btn" id="dlg-cancel">取消</button>'
          + '<button class="dialog-btn primary" id="dlg-ok">确定</button>'
          + '</div></div>';
      } else {
        overlay.className = 'modal-overlay';
        overlay.innerHTML =
          '<div class="modal">'
          + '<div class="modal-header"><h3>' + title + '</h3></div>'
          + '<div class="modal-body"><p>' + content + '</p></div>'
          + '<div class="modal-footer">'
          + '<button class="btn btn-outline" id="dlg-cancel">取消</button>'
          + '<button class="btn btn-primary" id="dlg-ok">确定</button>'
          + '</div></div>';
      }

      document.body.appendChild(overlay);
      if (!isMobileDevice) {
        requestAnimationFrame(function () { overlay.classList.add('show'); });
      }

      overlay.querySelector('#dlg-cancel').onclick = function () {
        overlay.classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 250);
        resolve(false);
      };
      overlay.querySelector('#dlg-ok').onclick = function () {
        overlay.classList.remove('show');
        setTimeout(function () { overlay.remove(); }, 250);
        resolve(true);
      };
    });
  }

  function openModal(id) {
    var el = document.getElementById(id);
    if (el) {
      el.style.display = 'flex';
      requestAnimationFrame(function () { el.classList.add('show'); });
    }
  }

  function closeModal(id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.remove('show');
      setTimeout(function () { el.style.display = 'none'; }, 250);
    }
  }

  return {
    toast: showToast,
    appToast: appToast,
    showLoading: showLoading,
    hideLoading: hideLoading,
    appShowLoading: appShowLoading,
    appHideLoading: appHideLoading,
    confirm: confirmDialog,
    openModal: openModal,
    closeModal: closeModal
  };
})();

var Utils = (function () {
  'use strict';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(d) {
    if (!d) return '-';
    var date = new Date(d);
    if (isNaN(date.getTime())) return '-';
    return date.getFullYear() + '-'
      + String(date.getMonth() + 1).padStart(2, '0') + '-'
      + String(date.getDate()).padStart(2, '0') + ' '
      + String(date.getHours()).padStart(2, '0') + ':'
      + String(date.getMinutes()).padStart(2, '0');
  }

  function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  return {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    getInitial: getInitial,
    isMobile: isMobile
  };
})();

var Storage = {
  get: function (key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch (e) { return null; }
  },
  set: function (key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove: function (key) { localStorage.removeItem(key); },
};

function setCookie(name, value, days) {
  var d = new Date();
  d.setTime(d.getTime() + (days || 30) * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}
function getCookie(name) {
  var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}
function deleteCookie(name) {
  document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
}

var KNOWN_ICONS = ['home','group','security','route','account_circle','login','logout','search',
  'delete','edit','add','settings','lock','email','phone','calendar_today','arrow_forward',
  'arrow_back','dashboard','menu','close','check','warning','error','info','refresh',
  'person','person_add','lock_reset','visibility','shield','key','link','sort','toggle_on',
  'toggle_off','verified_user','admin_panel_settings','manage_accounts','supervised_user_circle',
  'badge','contact_mail','alternate_email','vpn_key','how_to_reg','rocket_launch','chevron_right',
  'edit_note','inbox','search_off','description','save','palette','expand_more','block',
  'check_circle','star','folder','analytics','assessment','trending_up','bar_chart','pie_chart',
  'timeline','event','schedule','notifications','favorite','share','download','upload','cloud',
  'storage','backup','help','support','people','history','more_horiz','more_vert','filter_list',
  'sort_by_alpha','view_list','view_module','tune','build','code','terminal','dns','storage',
  'table_chart','multiline_chart','show_chart','equalizer','data_usage','insert_chart',
  'assignment','list_alt','receipt','pending','task_alt','published_with_changes',
  'disabled_visible','manage_search','find_in_page','find_replace','plagiarism',
  'speaker_notes','forum','chat','message','mail','drafts','mark_email_read',
  'mark_email_unread','unsubscribe','call','voicemail','textsms','dialpad','contacts',
  'import_contacts','perm_contact_calendar','photo_camera','image','camera_alt','attach_file',
  'insert_drive_file','folder_open','create_new_folder','drive_file_move','cloud_upload',
  'cloud_download','cloud_done','file_copy','content_copy','content_cut','content_paste',
  'link_off','insert_link','gesture','format_bold','format_italic','format_underlined',
  'format_align_left','format_align_center','format_align_right','format_align_justify',
  'undo','redo','zoom_in','zoom_out','fullscreen','fullscreen_exit','aspect_ratio',
  'crop','rotate_left','rotate_right','flip_to_front','flip_to_back','layers','layers_clear',
  'gradient','blur_on','blur_off','brightness_auto','brightness_high','brightness_low',
  'contrast','tonality','wb_sunny','wb_iridescent','hdr_on','hdr_off','exposure',
  'looks_one','looks_two','looks_3','looks_4','looks_5','looks_6',
  'filter_1','filter_2','filter_3','filter_4','filter_5','filter_6','filter_7','filter_8','filter_9',
  'filter_hdr','filter_vintage','photo_size_select_small','photo_size_select_large',
  'photo_size_select_actual','straighten','nature','landscape','portrait',
  'timer','hourglass_empty','hourglass_full','av_timer','loop','repeat','repeat_one',
  'play_arrow','pause','stop','skip_next','skip_previous','fast_forward','fast_rewind',
  'volume_up','volume_down','volume_off','volume_mute','mic','mic_off','headset',
  'speaker','radio','equalizer','surround_sound','settings_voice','record_voice_over',
  'hearing','hearing_disabled','speaker_group','speaker_phone','phonelink_ring','phone_callback',
  'phone_forwarded','phone_in_talk','phone_locked','phone_missed','phone_paused',
  'ring_volume','do_not_disturb_on','do_not_disturb_off','do_not_disturb','vibration',
  'power_settings_new','wifi','wifi_off','bluetooth','bluetooth_audio','bluetooth_connected',
  'bluetooth_disabled','bluetooth_searching','nfc','gps_fixed','gps_not_fixed','gps_off',
  'location_on','location_off','my_location','navigation','compass_calibration',
  'near_me','map','satellite','traffic','directions','directions_car','directions_bus',
  'directions_subway','directions_bike','directions_walk','directions_boat',
  'flight','flight_takeoff','flight_land','local_airport','local_shipping',
  'local_taxi','train','tram','subway','motorcycle','pedal_bike','electric_car',
  'electric_moped','electric_scooter','two_wheeler','agriculture','cleaning_services',
  'engineering','handyman','hardware','home_repair_service','plumbing',
  'carpenter','design_services','format_paint','grass','pest_control',
  'roofing','foundation','cabin','chalet','holiday_village','villa',
  'apartment','house','home','home_work','other_houses','real_estate_agent',
  'store','storefront','store_mall_directory','shopping_bag','shopping_basket',
  'shopping_cart','add_shopping_cart','remove_shopping_cart','local_mall',
  'local_offer','loyalty','confirmation_number','redeem','card_giftcard',
  'airline_seat_flat','airline_seat_flat_angled','airline_seat_individual_suite',
  'airline_seat_legroom_extra','airline_seat_legroom_normal','airline_seat_legroom_reduced',
  'airline_seat_recline_extra','airline_seat_recline_normal',
  'wifi_tethering','wifi_tethering_off','signal_cellular_alt','signal_cellular_0_bar',
  'signal_cellular_1_bar','signal_cellular_2_bar','signal_cellular_3_bar','signal_cellular_4_bar',
  'signal_wifi_0_bar','signal_wifi_1_bar','signal_wifi_2_bar','signal_wifi_3_bar','signal_wifi_4_bar',
  'battery_full','battery_charging_full','battery_std','battery_alert','battery_unknown',
  'brightness_auto','brightness_medium','flash_auto','flash_on','flash_off',
  'grid_on','grid_off','view_comfy','view_compact','view_week','view_day','view_stream',
  'view_agenda','view_column','view_carousel','view_quilt','dashboard_customize',
  'widgets','space_dashboard','auto_awesome','auto_awesome_mosaic','auto_awesome_motion',
  'auto_fix_high','auto_fix_normal','auto_fix_off','auto_stories','hdr_strong','hdr_weak',
  'hdr_enhanced_select','hdr_on_select','hdr_off_select','hdr_auto',
  'smart_display','smart_toy','smart_button','smart_screen','smart_toy',
  'tap_and_play','touch_app','pan_tool','pan_tool_alt','brush','format_color_fill',
  'format_color_reset','format_color_text','format_paint','draw','edit_off',
  'auto_graph','query_stats','candlestick_chart','waterfall_chart','stacked_line_chart',
  'ssid_chart','schema','pivot_table_chart','area_chart','bubble_chart',
  'scatter_plot','donut_large','donut_small','radar','hexagon','pentagon',
  'octagon','square','circle','triangle','rectangle','diamond',
  'r_mobiledata','raven','raw_off','raw_on','real_estate_agent',
  'recent_actors','recommend','record_voice_over','redeem','reduce_capacity',
  'remove_circle','remove_circle_outline','remove_done','remove_from_queue',
  'remove_moderator','remove_red_eye','remove_road','remove_shopping_cart',
  'remove','reorder','repartition','repeat_on','repeat_one_on','replay',
  'replay_10','replay_30','replay_5','replay_circle_filled',
  'report_problem','request_page','reset_tv','restart_alt','restaurant',
  'restore_from_trash','restore_page','reviews','rice_bowl','ring_volume',
  'robot','rocket','rocket_launch','roller_shades','roller_shades_closed',
  'roller_skating','roofing','room_preferences','room_service','rotate_90_degrees_ccw',
  'rotate_90_degrees_cw','rotate_left','rotate_right','roundabout_left',
  'roundabout_right','rowing','rss_feed','rsvp','rtt','rule','rule_folder',
  'run_circle','running_with_errors','rv_hookup','safety_check','sailing',
  'salinity','sanitizer','satellite','satellite_alt','save_alt','save_as',
  'saved_search','savings','scale','scanner','scatter_plot','schedule_send',
  'schema','school','science','score','scoreboard','screen_lock_landscape',
  'screen_lock_portrait','screen_lock_rotation','screen_rotation','screen_rotation_alt',
  'screen_search_desktop','screen_share','screenshot','screenshot_monitor',
  'scuba_diving','sd','sd_card','sd_card_alert','sd_storage','search_check',
  'search_off','security','security_update_good','security_update_warning',
  'segment','select_all','self_improvement','sell','send_and_archive','send_time_extension',
  'sensors','sensors_off','sentiment_dissatisfied','sentiment_neutral',
  'sentiment_satisfied','sentiment_satisfied_alt','sentiment_very_dissatisfied',
  'sentiment_very_satisfied','set_meal','settings_accessibility','settings_applications',
  'settings_backup_restore','settings_bluetooth','settings_brightness','settings_cell',
  'settings_ethernet','settings_input_antenna','settings_input_component',
  'settings_input_composite','settings_input_hdmi','settings_input_svideo',
  'settings_overscan','settings_phone','settings_power','settings_remote',
  'settings_suggest','settings_system_daydream','settings_voice','severe_cold',
  'shape_line','share_location','shield_moon','shop','shop_two','shopping_bag',
  'short_text','show_chart','shower','shuffle','shutter_speed','sick',
  'signal_cellular_alt_1_bar','signal_cellular_alt_2_bar','signal_wifi_bad',
  'signal_wifi_off','sim_card','single_bed','skateboarding','skip_next',
  'skip_previous','sledding','slideshow','slow_motion_video','smart_button',
  'smart_display','smart_screen','smart_toy','smartphone','smoke_free',
  'smoking_rooms','sms','sms_failed','snippet_folder','snooze','snowboarding',
  'snowmobile','snowshoeing','soap','social_distance','solar_power','source',
  'south','south_america','south_east','south_west','spa','space_bar',
  'speaker','speaker_group','speaker_notes','speaker_notes_off','speaker_phone',
  'speed','split_screen','spoke','sports','sports_bar','sports_baseball',
  'sports_basketball','sports_cricket','sports_esports','sports_football',
  'sports_golf','sports_gymnastics','sports_handball','sports_hockey',
  'sports_kabaddi','sports_mma','sports_motorsports','sports_rugby',
  'sports_score','sports_soccer','sports_tennis','sports_volleyball',
  'square_foot','ssid_chart','stacked_bar_chart','stacked_line_chart',
  'stadium','stairs','star_half','star_outline','stars','start','stay_current_landscape',
  'stay_current_portrait','stay_primary_landscape','stay_primary_portrait',
  'sticky_note_2','stop_circle','stop_screen_share','storage','store',
  'store_mall_directory','storefront','storm','straight','stream','streetview',
  'strikethrough_s','stroller','style','subdirectory_arrow_left',
  'subdirectory_arrow_right','subject','subscript','subtitles','subtitles_off',
  'subway','summarize','superscript','supervised_user_circle','supervisor_account',
  'support','support_agent','surfing','surround_sound','swap_calls','swap_horiz',
  'swap_vert','swap_vertical_circle','swipe','swipe_down','swipe_down_alt',
  'swipe_left','swipe_left_alt','swipe_right','swipe_right_alt','swipe_up',
  'swipe_up_alt','swipe_vertical','switch_access_shortcut','switch_access_shortcut_add',
  'switch_account','switch_camera','switch_left','switch_right','switch_video',
  'synagogue','sync','sync_alt','sync_disabled','sync_lock','sync_problem',
  'system_security_update','system_security_update_good','system_security_update_warning',
  'system_update','system_update_alt','tab','tab_unselected','table_bar',
  'table_chart','table_restaurant','table_rows','table_view','tablet',
  'tablet_android','tablet_mac','tag','tag_faces','takeout_dining','tap_and_play',
  'tapas','task','task_alt','taxi_alert','temple_buddhist','temple_hindu',
  'tenancy','terminal','terrain','text_decrease','text_fields','text_format',
  'text_increase','text_rotate_up','text_rotate_vertical','text_rotation_angledown',
  'text_rotation_angleup','text_rotation_down','text_rotation_none','text_snippet',
  'textsms','texture','theater_comedy','theaters','thermostat','thermostat_auto',
  'thumb_down','thumb_down_alt','thumb_down_off_alt','thumb_up','thumb_up_alt',
  'thumb_up_off_alt','thumbs_up_down','thunderstorm','time_to_leave','timelapse',
  'timeline','timer','timer_10','timer_10_select','timer_3','timer_3_select',
  'timer_off','tips_and_updates','tire_repair','title','toc','today','toggle_off',
  'toggle_on','token','toll','tonality','topic','tornado','touch_app','tour',
  'toys','track_changes','traffic','trail_length','trail_length_medium',
  'trail_length_short','train','tram','transfer_within_a_station','transform',
  'transgender','transit_enterexit','translate','travel_explore','trending_down',
  'trending_flat','trending_up','trip_origin','trolley','try','tsunami','tty',
  'tune','tungsten','turn_left','turn_right','turn_sharp_left','turn_sharp_right',
  'turn_slight_left','turn_slight_right','turned_in','turned_in_not','tv',
  'tv_off','two_wheeler','type_specimen','u_turn_left','u_turn_right','umbrella',
  'unarchive','undo','unfold_less','unfold_more','unpublished','unsubscribe',
  'upcoming','update','update_disabled','upgrade','upload','upload_file',
  'usb','usb_off','vaccines','vape_free','vaping_rooms','verified','verified_user',
  'vertical_align_bottom','vertical_align_center','vertical_align_top',
  'vertical_distribute','vertical_shades','vertical_shades_closed',
  'vertical_split','vibration','video_call','video_camera_back',
  'video_camera_front','video_collection','video_file','video_label',
  'video_library','video_settings','video_stable','videocam','videocam_off',
  'videogame_asset','videogame_asset_off','view_agenda','view_array',
  'view_carousel','view_column','view_comfy','view_comfy_alt','view_compact',
  'view_compact_alt','view_cozy','view_day','view_headline','view_in_ar',
  'view_kanban','view_list','view_module','view_quilt','view_sidebar',
  'view_stream','view_timeline','view_week','vignette','villa','visibility',
  'visibility_off','voice_chat','voice_over_off','voicemail','volcano',
  'volume_down','volume_down_alt','volume_mute','volume_off','volume_up',
  'volunteer_activism','vpn_key','vpn_lock','vrpano','wallpaper','warehouse',
  'warning','warning_amber','wash','watch','watch_later','watch_off',
  'water','water_damage','water_drop','waterfall_chart','waves','waving_hand',
  'wb_auto','wb_cloudy','wb_incandescent','wb_iridescent','wb_shade',
  'wb_sunny','wb_twilight','wc','web','web_asset','web_asset_off',
  'web_stories','webhook','weekend','west','whatshot','wheelchair_pickup',
  'where_to_call','widgets','width_full','width_normal','width_wide',
  'wifi','wifi_1_bar','wifi_2_bar','wifi_calling','wifi_calling_1',
  'wifi_calling_2','wifi_calling_3','wifi_channel','wifi_find','wifi_lock',
  'wifi_off','wifi_password','wifi_protected_setup','wifi_tethering',
  'wifi_tethering_error','wifi_tethering_off','wind_power','window',
  'wine_bar','woman','woman_2','work','work_history','work_off','work_outline',
  'workspace_premium','workspaces','wrap_text','wrong_location','wysiwyg',
  'yard','youtube_searched_for','zoom_in','zoom_in_map','zoom_out','zoom_out_map'];

function mi(name, cls) {
  return '<i class="mi' + (cls ? ' ' + cls : '') + '">' + name + '</i>';
}
function miSpan(name, text, cls) {
  return '<span class="flex-center gap-6">' + mi(name, cls) + Utils.escapeHtml(text) + '</span>';
}

function renderIcon(iconText) {
  var fontOk = !(document.fonts && document.fonts.check) || document.fonts.check('1em "Material Icons"');
  if (!fontOk) {
    return '<i class="mi mi-fallback">\u2662</i>';
  }
  if (KNOWN_ICONS.indexOf(iconText) !== -1) {
    return '<i class="mi">' + iconText + '</i>';
  }
  return iconText || '<i class="mi">description</i>';
}

(function () {
  var FONT_NAME = '1em "Material Icons"';
  var PLACEHOLDER = '\u2662';
  var checked = false;

  function applyFallback() {
    document.querySelectorAll('.mi').forEach(function (el) {
      if (!el.classList.contains('mi-fallback')) {
        el.textContent = PLACEHOLDER;
        el.classList.add('mi-fallback');
      }
    });
  }

  function checkAndApply() {
    if (checked) return;
    checked = true;
    if (document.fonts && document.fonts.check) {
      if (!document.fonts.check(FONT_NAME)) {
        applyFallback();
      }
      document.fonts.ready.then(function () {
        if (!document.fonts.check(FONT_NAME)) {
          applyFallback();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndApply);
  } else {
    checkAndApply();
  }

  window._checkIconFont = function () {
    if (document.fonts && document.fonts.check && !document.fonts.check(FONT_NAME)) {
      applyFallback();
    }
  };
})();

function iconSelectHtml(selected, inputId) {
  inputId = inputId || '';
  return '<input type="hidden" id="' + inputId + '" value="' + (selected || '') + '">'
    + '<div class="icon-pick-trigger" onclick="openIconPicker(\'' + inputId + '\')" id="' + (inputId ? inputId + '-preview' : 'icon-pick-preview') + '">'
    + (selected ? '<i class="mi">' + selected + '</i> ' + selected : '<i class="mi">palette</i> 选择图标')
    + '</div>';
}

function createActionSheet(innerHtml, opts) {
  opts = opts || {};
  var overlay = document.createElement('div');
  overlay.className = 'app-action-sheet-overlay show';
  var sheetStyle = 'transform:translateY(0)';
  if (opts.maxHeight) sheetStyle += ';max-height:' + opts.maxHeight;
  overlay.innerHTML = '<div class="app-action-sheet" style="' + sheetStyle + '">' + innerHtml + '</div>';
  document.body.appendChild(overlay);

  var prevClose = window.closeActionSheet;

  window.closeActionSheet = function () {
    overlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
    setTimeout(function () { overlay.remove(); }, 350);
    window.closeActionSheet = prevClose;
  };

  overlay.onclick = function (e) {
    if (e.target === overlay) window.closeActionSheet();
  };

  return overlay;
}

function closeActionSheet() {
  if (typeof window.closeActionSheet === 'function') window.closeActionSheet();
}

function openIconPicker(inputId, onChange) {
  var input = document.getElementById(inputId);
  var current = input ? input.value : '';
  var mobile = window.innerWidth <= 768;

  var iconGridHtml = KNOWN_ICONS.map(function (icon) {
    var active = icon === current ? ' active' : '';
    return '<div class="icon-pick-item' + active + '" data-icon="' + icon + '" title="' + icon + '">'
      + '<i class="mi">' + icon + '</i>'
      + '</div>';
  }).join('');

  var pickerOverlay;

  if (mobile) {
    var parentClose = window.closeActionSheet;
    pickerOverlay = createActionSheet(
      '<div class="sheet-handle"></div>'
      + '<div class="sheet-title">选择图标</div>'
      + '<div class="p-0-12-12">'
      + '<div class="app-search mb-8"><span class="search-icon">' + mi('search', 'mi-16') + '</span><input type="text" placeholder="搜索图标名称..." id="icon-pick-search" oninput="filterIconPicker(this.value)"></div>'
      + '<div class="icon-pick-grid">' + iconGridHtml + '</div>'
      + '</div>'
      + '<div class="sheet-cancel" id="icon-pick-cancel">取消</div>',
      { maxHeight: '70vh' }
    );
    window.closeActionSheet = parentClose;

    function closePicker() {
      pickerOverlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
      setTimeout(function () { pickerOverlay.remove(); }, 350);
    }
    pickerOverlay.querySelector('#icon-pick-cancel').onclick = closePicker;
    pickerOverlay.onclick = function (e) {
      if (e.target === pickerOverlay) closePicker();
    };
  } else {
    pickerOverlay = document.createElement('div');
    pickerOverlay.className = 'modal-overlay';
    pickerOverlay.innerHTML =
      '<div class="modal" style="max-width:560px">'
      + '<div class="modal-header"><h3>选择图标</h3><button class="modal-close" id="icon-pick-close">✕</button></div>'
      + '<div class="modal-body modal-body-scroll">'
      + '<div class="mb-10"><input class="form-input" type="text" placeholder="搜索图标名称..." id="icon-pick-search" oninput="filterIconPicker(this.value)"></div>'
      + '<div class="icon-pick-grid">' + iconGridHtml + '</div>'
      + '</div></div>';
    document.body.appendChild(pickerOverlay);
    requestAnimationFrame(function () { pickerOverlay.classList.add('show'); });

    function closePickerModal() {
      pickerOverlay.classList.remove('show');
      setTimeout(function () { pickerOverlay.remove(); }, 250);
    }
    pickerOverlay.querySelector('#icon-pick-close').onclick = closePickerModal;
    pickerOverlay.onclick = function (e) {
      if (e.target === pickerOverlay) closePickerModal();
    };
  }

  var pickerItems = pickerOverlay.querySelectorAll('.icon-pick-item');
  for (var i = 0; i < pickerItems.length; i++) {
    (function (item) {
      item.addEventListener('click', function () {
        var icon = item.dataset.icon;
        if (input) input.value = icon;
        pickerOverlay.querySelectorAll('.icon-pick-item').forEach(function (el) { el.classList.remove('active'); });
        item.classList.add('active');
        if (mobile) {
          pickerOverlay.querySelector('.app-action-sheet').style.transform = 'translateY(100%)';
          setTimeout(function () { pickerOverlay.remove(); }, 350);
        } else {
          pickerOverlay.classList.remove('show');
          setTimeout(function () { pickerOverlay.remove(); }, 250);
        }
        if (typeof onChange === 'function') onChange(icon);
      });
    })(pickerItems[i]);
  }
}

window.filterIconPicker = function(keyword) {
  keyword = (keyword || '').toLowerCase();
  var items = document.querySelectorAll('.icon-pick-item');
  for (var i = 0; i < items.length; i++) {
    var icon = items[i].dataset.icon || '';
    var title = items[i].getAttribute('title') || '';
    var match = keyword === '' || icon.indexOf(keyword) !== -1 || title.indexOf(keyword) !== -1;
    items[i].style.display = match ? '' : 'none';
  }
};

function checkPwdStrength(pwd) {
  if (!pwd) return { level: 0, text: '', color: '' };
  var score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  if (score <= 1) return { level: 1, text: '弱', color: '#ff6b6b' };
  if (score <= 3) return { level: 2, text: '中', color: '#ffa726' };
  return { level: 3, text: '强', color: '#66bb6a' };
}

function pwdStrengthHtml(inputId) {
  return '<div class="pwd-strength" id="' + inputId + '-strength" style="display:none">'
    + '<div class="flex gap-4 mt-8">'
    + '<div class="str-bar"></div>'
    + '<div class="str-bar"></div>'
    + '<div class="str-bar"></div>'
    + '</div>'
    + '<span class="str-text fs-11 mt-4 text-secondary" style="display:block"></span>'
    + '</div>';
}

function bindPwdStrength(inputId) {
  var input = document.getElementById(inputId);
  var container = document.getElementById(inputId + '-strength');
  if (!input || !container) return;
  input.addEventListener('input', function() {
    var val = input.value;
    if (!val) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    var result = checkPwdStrength(val);
    var bars = container.querySelectorAll('.str-bar');
    var text = container.querySelector('.str-text');
    if (text) text.textContent = result.text;
    for (var i = 0; i < bars.length; i++) {
      if (i < result.level) {
        bars[i].style.background = result.color;
      } else {
        bars[i].style.background = 'var(--border)';
      }
    }
  });
}

function checkPwdStrengthCore(pwd) {
  return checkPwdStrength(pwd);
}

// ==================== 键盘快捷键 ====================
(function() {
  document.addEventListener('keydown', function(e) {
    // Esc: 关闭弹窗/action sheet
    if (e.key === 'Escape') {
      // PC 端关闭 modal
      var openModal = document.querySelector('.modal-overlay.show');
      if (openModal) {
        openModal.classList.remove('show');
        setTimeout(function() { openModal.style.display = 'none'; }, 250);
        return;
      }
      // 移动端关闭 action sheet
      var sheetOverlay = document.querySelector('.app-action-sheet-overlay.show');
      if (sheetOverlay) {
        var sheet = sheetOverlay.querySelector('.app-action-sheet');
        if (sheet) sheet.style.transform = 'translateY(100%)';
        setTimeout(function() { sheetOverlay.remove(); }, 350);
        return;
      }
      // PC 端关闭主题面板
      var themePanel = document.getElementById('theme-panel');
      if (themePanel && themePanel.classList.contains('show')) {
        themePanel.classList.remove('show');
        return;
      }
    }

    // Ctrl+K: 聚焦搜索框（跳过输入框内的情况，除非在搜索框里）
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      var searchInput = document.querySelector('.app-search input, .search-bar input, #user-search, #log-search, #pc-user-search, #pc-log-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });
})();

window.showToast = UI.toast;
window.appToast = UI.appToast;
window.showLoading = UI.showLoading;
window.hideLoading = UI.hideLoading;
window.appShowLoading = UI.appShowLoading;
window.appHideLoading = UI.appHideLoading;
window.confirmDialog = UI.confirm;
window.openModal = UI.openModal;
window.closeModal = UI.closeModal;
window.escapeHtml = Utils.escapeHtml;
window.formatDate = Utils.formatDate;
window.getInitial = Utils.getInitial;
window.isMobile = Utils.isMobile;
