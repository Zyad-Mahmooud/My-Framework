(function (){
var States = {};
var Context = {};
var events = [];
function isListener(string) {
  return String(string).startsWith("on") && string[2] === string[2].toUpperCase();
}
function listen(state, callback) {
  if(typeof state == "string") {
    events.push({
    state,
    callback
  });
  } else if(Array.isArray(state)) {
    state.forEach((name)=>{
      if(name) {
    events.push({
    state: name,
    callback
  });
      }
    });
  }
}
function virtualNode(options) {
  options.ref = document.createElement(options.tagName);
  options.props = options.props || {}; 

  Object.keys(options.props).forEach(function(p) {
    const propValue = options.props[p];
    if(p == "style" || p === "Style") {
      console.log("is StyleState");
    }
    if (isListener(p)) {
      const eventName = p.replace("on", "").toLowerCase();
      options.ref.addEventListener(eventName, propValue);
      return;
    }

    let stateName = null;
    for (let name in States) {
      if (Context[name] === propValue) {
        stateName = name;
        break;
      }
    }

    if (stateName) {
      States[stateName].subscribers.push({
        subscriber: options,
        propName: p 
      });

      updateElement(options.ref, p, Context[stateName].value);
    } else {
      updateElement(options.ref, p, propValue);
    }
  });

  if (options.childrens) {
    options.childrens.forEach((W)=>{
      if (W) options.ref.appendChild(W.ref);
    });
  }

  return options;
}

function updateElement(ref, prop, value) {
  if (prop === "style" && typeof value === "object") {
    Object.assign(ref.style, value);
  } else if (prop in ref) {
    ref[prop] = value;
  } else {
    ref.setAttribute(prop, value);
  }
}

function triggerSubscribers(name, newVal) {
  if (States[name]) {
    for (subscriber of States[name].subscribers) {
      if(subscriber) {
      if (!subscriber.subscriber.ref.isConnected) {
        delete States[name].subscribers[i];
        return;
      }
      requestAnimationFrame(()=>{
        updateElement(subscriber.subscriber.ref, subscriber.propName, newVal);
      });
      }
    }
    }
}


function Wrappe(data, stateName) {
  return new Proxy(data, {
    set(target, prop, value) {
      target[prop] = value;

      requestAnimationFrame(()=>{
        triggerSubscribers(stateName, target);
      });

      return true;
    },
    get(target, prop) {
      const val = target[prop];
      if (val && (val && typeof val === "object")) return Wrappe(val, stateName);
      return val;
    }
  });
}

function createState(name, initialValue) {
  let _internalState = {
    value: (initialValue && (typeof initialValue === "object" || typeof initialValue === "array")) 
      ? Wrappe(initialValue, name) 
      : initialValue,
    subscribers: []
  };
  Context[name] = { __reactive: true };

  Object.defineProperty(Context[name], "value", {
    get() { return _internalState.value; },
    set(newVal) {
      _internalState.value = ((newVal && typeof newVal === "object") || (newVal && Array.isArray(newVal)) 
        ? Wrappe(newVal, name) 
        : newVal);

      requestAnimationFrame(()=>{
        triggerSubscribers(name, _internalState.value);
        events.forEach((ev)=>{
          if(ev) {
            if(ev.state.includes(name)) {
              ev.callback({
                state: name,
                value: _internalState.value
              });
            }
          }
        });
      });
    }
  });

  States[name] = _internalState;
}


createState("userName", {});
createState("rrr", []);
listen(["userName","rrr"],(c)=>{
  console.log(c.state,c.value);
});
with (Context) {
  var slider = virtualNode({
    tagName: "input",
    props: {
      type: "range",
      min: 0,
      max: 1024,
      onInput: function(event) {
        userName.value = JSON.stringify({
          a: event.target.value
        }, null, 2);

        rrr.value.push(event.target.value);
      }
    }
  });
  var input = virtualNode({
    tagName: "input",
    props: {
     placeholder: userName,
    type: "text",
    onInput: function(e) {
      rrr.value = e.target.value;
    }
    }
  });
  var heading = virtualNode({
    type: "h1",
    props:{
      innerText: userName
    }
  });
  var main = virtualNode({
    tagName: "main",
    childrens: [heading, slider, input]
  });

  document.getElementById("root").appendChild(main.ref);
}
})();