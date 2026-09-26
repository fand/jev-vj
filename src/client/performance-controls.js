// Physical digit codes also cover Shift+1 (!), international layouts and numpads.
export function performanceAction(event, editing = false) {
 if(event.isComposing || event.ctrlKey || event.metaKey || event.altKey)return null;
 if(editing)return event.key==='Escape'?{type:'blur'}:null;
 if(event.repeat)return null;
 const digit=/^(?:Digit|Numpad)([0-9])$/.exec(event.code)?.[1];
 if(digit>='1'&&digit<='4')return {type:'choose',index:Number(digit)-1,transition:event.shiftKey};
 if(digit==='0')return {type:'kill'};
 if(digit==='8'||digit==='9')return {type:'strobe',white:digit==='8'};
 if(event.code==='Space')return {type:'focus'};
 if(['+','='].includes(event.key)||event.code==='NumpadAdd')return {type:'duration',delta:.05};
 if(event.key==='-'||event.code==='NumpadSubtract')return {type:'duration',delta:-.05};
 return null;
}
export function transitionDuration(value) {return Math.round(Math.max(0,Math.min(1,Number(value)||0))*100)/100;}
export function transitionProgress(now,start,seconds) {return seconds<=0?1:Math.max(0,Math.min(1,(now-start)/(seconds*1000)));}
