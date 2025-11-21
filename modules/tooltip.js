/**
 * Accessible Tooltip Module (auto-placement)
 * Keyboard + mouse; SR-friendly with aria-describedby & role="tooltip"
 */
import { createElement, listen } from './utils.js';

export function initTooltips() {
  const triggers = document.querySelectorAll('[data-tooltip-id]');
  
  triggers.forEach(trigger => {
    const id = trigger.getAttribute('data-tooltip-id');
    const text = trigger.getAttribute('data-tooltip-text');
    if (!id || !text) return;

    // Create tooltip if not present
    let tooltip = document.getElementById(id);
    if (!tooltip) {
      // Your createElement signature: (tag, attrs, ...children)
      tooltip = createElement('div', { 
        id, 
        role: 'tooltip', 
        className: 'tooltip hidden' 
      }, text);
      document.body.appendChild(tooltip);
    }

    trigger.setAttribute('aria-describedby', id);

    const show = () => positionAndShow(trigger, tooltip);
    const hide = () => hideTooltip(tooltip);

    listen(trigger, 'mouseenter', show);
    listen(trigger, 'mouseleave', hide);
    listen(trigger, 'focus', show);
    listen(trigger, 'blur', hide);
  });
}

function positionAndShow(trigger, tooltip) {
  tooltip.classList.remove('hidden');
  tooltip.style.visibility='hidden';
  tooltip.style.top='0';
  tooltip.style.left='0';

  const rect = trigger.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const pad = 8;

  const ttRect = tooltip.getBoundingClientRect();
  let top = rect.top + scrollY - ttRect.height - pad;
  let placement = 'top';
  if (top < 0) { 
    top = rect.bottom + scrollY + pad;
    placement = 'bottom';
  }

  let left = rect.left + scrollX + rect.width/2 - ttRect.width/2;
  left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.dataset.placement = placement;
  tooltip.style.visibility='visible';
}

function hideTooltip(tooltip) {
  tooltip.classList.add('hidden');
  tooltip.style.visibility='hidden';
}