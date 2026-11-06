// Applies saved Tweaks before the page paints, so there is no flash of the wrong theme.
// Loaded as a classic script in <head> (the CSP blocks inline scripts).
(function(){
  var defaults={color:'lavender',mode:'auto',text:'normal',effects:'full',sound:'on'};
  var saved={};
  try{saved=JSON.parse(localStorage.getItem('ninja-tweaks')||'{}')||{};}catch(e){saved={};}
  var root=document.documentElement;
  Object.keys(defaults).forEach(function(key){root.dataset[key]=saved[key]||defaults[key];});
})();
