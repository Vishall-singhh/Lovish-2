(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const year=$('#year');
  if(year) year.textContent=new Date().getFullYear();

  const header=$('.topbar');
  addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>25),{passive:true});

  const trigger=$('.menu-trigger'), menu=$('.menu');
  trigger?.addEventListener('click',()=>{
    const open=trigger.getAttribute('aria-expanded')!=='true';
    trigger.setAttribute('aria-expanded',String(open));
    menu?.classList.toggle('open',open);
  });
  $$('.menu a').forEach(a=>a.addEventListener('click',()=>{
    menu?.classList.remove('open');
    trigger?.setAttribute('aria-expanded','false');
  }));

  // Reveal every major content block from below-centre, progressively during scroll.
  const revealTargets=$$('.hero-title-wrap,.hero-art,.hero-bottom,.manifesto-grid,.manifesto-marquee,.services-heading,.service-item,.impact-lockup,.impact-foot,.work-heading,.gallery-card,.concept-disclaimer,.contact-title,.contact-links');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('reveal','in');
          io.unobserve(entry.target);
        }
      });
    },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
    revealTargets.forEach((el,i)=>{
      el.classList.add('reveal');
      el.classList.remove('in');
      io.observe(el);
    });
  } else revealTargets.forEach(el=>el.classList.add('in'));

  // High-contrast liquid cursor: a continuous, tapered glossy ribbon.
  const canvas=$('#liquid'), cursor=$('.cursor-core'), ctx=canvas?.getContext('2d',{alpha:true});
  const fine=matchMedia('(pointer:fine)').matches;
  if(!canvas||!ctx||!fine){
    canvas?.remove(); cursor?.remove(); return;
  }

  let W=innerWidth,H=innerHeight,D=Math.min(devicePixelRatio||1,2);
  const mouse={x:W/2,y:H/2}, smooth={x:W/2,y:H/2};
  const trail=[], ripples=[];
  const MAX=42;
  let active=false;

  function resize(){
    W=innerWidth; H=innerHeight; D=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*D); canvas.height=Math.round(H*D);
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(D,0,0,D,0,0);
  }
  resize();
  addEventListener('resize',resize,{passive:true});

  addEventListener('pointermove',e=>{
    mouse.x=e.clientX; mouse.y=e.clientY; active=true;
    if(cursor) cursor.style.opacity='1';
  },{passive:true});

  addEventListener('pointerdown',e=>{
    cursor?.classList.add('press');
    ripples.push({x:e.clientX,y:e.clientY,r:3,a:.9});
  });
  addEventListener('pointerup',()=>cursor?.classList.remove('press'));

  $$('.menu a, a, button, .service-item, .gallery-card').forEach(el=>{
    el.addEventListener('pointerenter',()=>cursor?.classList.add('hover'));
    el.addEventListener('pointerleave',()=>cursor?.classList.remove('hover'));
  });

  // Magnetic pull for key CTAs; restrained so text remains readable.
  $$('.contact-button,.menu-contact').forEach(el=>{
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      const dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height/2);
      el.style.transform=`translate(${dx*.055}px,${dy*.09}px)`;
    });
    el.addEventListener('pointerleave',()=>el.style.transform='');
  });

  function drawRibbon(points){
    if(points.length<3) return;
    // Draw several blended strokes over exactly the same smooth path.
    const path=()=>{
      ctx.beginPath();
      ctx.moveTo(points[0].x,points[0].y);
      for(let i=1;i<points.length-1;i++){
        const p=points[i], n=points[i+1];
        ctx.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2);
      }
      const last=points[points.length-1];
      ctx.lineTo(last.x,last.y);
    };
    const stroke=(color,width,alpha,blur)=>{
      ctx.save(); path();
      ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=width;
      ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.shadowColor=color; ctx.shadowBlur=blur;
      ctx.stroke(); ctx.restore();
    };
    // Broad refracted crimson halo and dark liquid body.
    stroke('#f32635',22,.23,24);
    stroke('#030304',15,.82,10);
    // Bright glass edge is deliberately visible on pure black backgrounds.
    stroke('#f1eeee',5,.72,9);
    stroke('#ffffff',2.1,1,5);
    stroke('#f32635',1.2,.95,4);

    // Taper the tail by fading and narrowing older segments.
    for(let i=1;i<points.length;i++){
      const p=points[i], prev=points[i-1], t=i/points.length;
      ctx.save();
      ctx.globalAlpha=.8*p.life;
      ctx.strokeStyle='#ffffff';
      ctx.lineWidth=.5+2.4*t*p.life;
      ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(prev.x,prev.y); ctx.lineTo(p.x,p.y); ctx.stroke();
      ctx.restore();
    }
  }

  function animate(){
    // Fast catch-up at the cursor, then leave a soft, physical-looking fluid trail.
    smooth.x+=(mouse.x-smooth.x)*.48;
    smooth.y+=(mouse.y-smooth.y)*.48;
    if(cursor && active){
      cursor.style.transform=`translate(${smooth.x}px,${smooth.y}px) translate(-50%,-50%)`;
    }

    const last=trail[trail.length-1];
    if(active && (!last || Math.hypot(smooth.x-last.x,smooth.y-last.y)>1.4)){
      trail.push({x:smooth.x,y:smooth.y,life:1});
    }
    trail.forEach(p=>p.life*=.965);
    while(trail.length>MAX || (trail[0]&&trail[0].life<.045)) trail.shift();

    ctx.clearRect(0,0,W,H);
    drawRibbon(trail);

    for(let i=ripples.length-1;i>=0;i--){
      const r=ripples[i]; r.r+=2.8; r.a*=.94;
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(243,38,53,${r.a})`; ctx.lineWidth=1.4; ctx.stroke();
      ctx.beginPath(); ctx.arc(r.x,r.y,r.r+6,0,Math.PI*2);
      ctx.strokeStyle=`rgba(255,255,255,${r.a*.45})`; ctx.lineWidth=.9; ctx.stroke();
      if(r.a<.025) ripples.splice(i,1);
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();