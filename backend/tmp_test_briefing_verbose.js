(async()=>{
  try{
    const base='http://localhost:5000/api';
    const email='test'+Date.now()+'@example.com';
    const pwd='TestPass123!';
    const name='DevTester';

    let r=await fetch(base+'/auth/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,email,password:pwd})
    });
    let reg=await r.json();
    console.log('register', r.status, 'token:', !!reg.token);

    let token = reg.token;
    if(!token){
      const loginRes = await fetch(base+'/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password:pwd})
      });
      const loginJson = await loginRes.json();
      console.log('login', loginRes.status, 'token:', !!loginJson.token);
      token = loginJson.token;
    }

    if(!token){ console.error('No token obtained'); return; }

    r = await fetch(base+'/briefing/refresh',{
      method:'POST',
      headers:{ Authorization: 'Bearer '+token }
    });
    let rtext;
    try{ rtext = await r.text(); } catch(e){ rtext = 'no body'; }
    console.log('/briefing/refresh', r.status, rtext.slice(0,1000));

    const todayRes = await fetch(base+'/briefing/today',{
      headers:{ Authorization: 'Bearer '+token }
    });
    const todayText = await todayRes.text();
    console.log('/briefing/today', todayRes.status, todayText.slice(0,1000));
  }catch(e){ console.error('ERR', e.message); }
})();
