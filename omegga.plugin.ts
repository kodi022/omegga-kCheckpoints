import OmeggaPlugin, { OL, PS, PC, OmeggaPlayer, IPlayerPositions, Vector } from 'omegga';

type Config = { foo: string };
type Storage = { bar: string };

type TimeCheck = {
  player: string,
  time: number,
}

export default class Plugin implements OmeggaPlugin<Config, Storage> {
  omegga: OL;
  config: PC<Config>;
  store: PS<Storage>;

  constructor(omegga: OL, config: PC<Config>, store: PS<Storage>) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;
  }

  // this had killing, but orion did it better so use orion's killcommand plugin

  // TO-DO:
  // limit use speed of certain commands
  // have /reply for dms by tracking last 10 messages or something

  async init() {
    const auth = this.config["Authorized-Users"];
    const spamhurt_speed = this.config["Spamhurt-Speed"];
    const enable_dms = this.config["Enable-Direct-Messages"];
    let time_limits: TimeCheck[] = [];

    Omegga.on('cmd:hurt', async (speaker: string, name: string, number: string) => 
    {
      if (auth.find(e => e.name == speaker)) {
        if (!name) { command_print("/hurt (name) (damage)", speaker); return; }

        const player: OmeggaPlayer = Omegga.findPlayerByName(name) || undefined;

        let damage: number = Number(number);
        if (isNaN(damage) || damage == 0) { damage = 1; }

        if (name === "*") {
          const players: IPlayerPositions = await Omegga.getAllPlayerPositions();
          for (let e of players) e.player.damage(damage);
          font_print(`Hurt everyone for ${damage}`, {whisper: speaker, color: "f66"})
        } else if (player) {
          player.damage(damage);
          font_print(`Hurt ${player.name} for ${damage}`, {whisper: speaker, color: "f66"});
        } else { font_print(`Couldn't find ${name}`, {whisper: speaker}); }
      } else { warn_print(`You're not authorized`, speaker); }
    });

    Omegga.on('cmd:spamhurt', async (speaker: string, name: string, number: string, number2: string) => {
      if (auth.find(e => e.name == speaker)) {
        if (!name) { command_print("/spamhurt (name) (damage) (amount of hits)", speaker); return; }

        const player: OmeggaPlayer = Omegga.findPlayerByName(name) || undefined;
        if (!player && name != "*") { font_print("Couldn't find player.", {whisper: speaker, size: 26}); return; }

        let damage: number = Number(number);
        let times: number = Number(number2);
        if (isNaN(damage) || damage < 0) { damage = 1; }
        if (isNaN(times) || times < 1) { times = 25; }

        if (name === "*") {
          let players: IPlayerPositions = await Omegga.getAllPlayerPositions();
          font_print(`Hurt everyone ${damage} damage ${times} times`, {color: "f66"});
          for (let i = 0; i < times; i++) {
            for (let e of players) e.player.damage(damage);
            await sleep(spamhurt_speed);
          }  
        } else if (player) {
          font_print(`Hurt ${player.name} ${times} times for ${damage} damage`, {whisper: speaker, color: "f66"});
          for (let i = 0; i < times; i++) {
            player.damage(damage);
            await sleep(spamhurt_speed);
          }  
        } else { font_print(`Couldn't find ${name}`, {whisper: speaker}); }
      } else { warn_print(`You're not authorized`, speaker); }
    });

    Omegga.on('cmd:pos', async (speaker: string) => {
      const pos = await Omegga.getPlayer(speaker).getPosition() || undefined;
      if (pos) font_print(`You are at (<color="f77">${Math.floor(pos[0])}</>, <color="7f7">${Math.floor(pos[1])}</>, <color="77f">${Math.floor(pos[2])}</>)`, {whisper: speaker, color: "fff"});
    });5

    if (enable_dms) {
      Omegga.on('cmd:dm', (speaker: string, name: string, ...values: string[]) => { // is sanitized
        if (!name) { command_print("/dm (name) (message)", speaker); return; }
        const player: OmeggaPlayer = Omegga.findPlayerByName(name) || undefined;
        if (!player) { font_print("Couldn't find player", {whisper: speaker}); return; }

        const message = OMEGGA_UTIL.chat.sanitize(values.join(" "));
        font_print(`<color="c2c"><u>DM</></> Sent (${message.slice(0, 14)}...) to  <color="6dd">${name}</>`, {whisper: speaker});
        font_print(`<color="c2c"><u>DM</></> <color="6dd">${speaker}</>: ${message}`, {whisper: player.name});
      });
    }

    Omegga.on('cmd:middle', (speaker: string, ...values: string[]) => { // auth only, test with allowing rich text
      if (auth.find(e => e.name == speaker)) {
        const string: string = values.join(" ") || undefined;
        if (!string) { font_print("Requires a message.", {whisper: speaker}); return; }

        font_print(string, {whisper: "middle"});
      } else { warn_print(`You're not authorized`, speaker); }
    }); 

    function command_print(string: string, whisper: string) 
    {
      font_print(string, {whisper: whisper, code: true, size: 20, color: "fff"});
    }
    function warn_print(string: string, whisper: string) 
    {
      font_print(string, {whisper: whisper, size: 18, color: "f88"});
    }
    function font_print(message: string, options?: {whisper?: string, size?: number, color?: string, code?: boolean}) {
      if (options.color) message = OMEGGA_UTIL.chat.color(message, options.color);
      if (options.size) message = OMEGGA_UTIL.chat.size(message, options.size);
      if (options.code) message = OMEGGA_UTIL.chat.code(message);

      if (options.whisper) {
        if (options.whisper.includes("middle")) {
          const players = Omegga.getPlayers();
          for (let p of players) Omegga.middlePrint(p.name, message); 
        } else Omegga.whisper(options.whisper, message);
      } else Omegga.broadcast(message); 
    }
  
    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    return { registeredCommands: ['hurt', 'spamhurt', 'pos', 'dm', 'middle'] };
  }
  async stop() { }
}
