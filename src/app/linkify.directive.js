'use strict';

import linkifyStr from 'linkifyjs/string';

export default (el, binding) => {
  el.innerHTML = linkifyStr(el.innerHTML, binding.value);
};
