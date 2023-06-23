import notifier from 'node-notifier';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator/index.js';
import clipboard from 'clipboardy';
import minimist from 'minimist';
class ClipTranslate {
    text;
    to;
    from;
    delay;
    translator;
    constructor() {
        var argv = minimist(process.argv.slice(2));
        this.to = argv.to ?? 'it';
        this.from = argv.from ?? 'ru';
        this.delay = argv.delay ?? 50;
        this.translator = new GoogleTranslator({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
            },
        });
        this.text = '';
    }
    sleep(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    async run() {
        await this.sleep(this.delay);
        try {
            let clipText = await clipboard.read();
            if (clipText != this.text && clipText != '') {
                this.text = clipText;
                // clipText
                let translated = await this.translator.translate(this.text, this.from, this.to);
                notifier.notify({
                    title: clipText,
                    message: translated
                });
                this.text = translated;
                clipboard.writeSync(translated);
            }
        }
        catch (e) {
            notifier.notify('Error translate');
            console.log(e);
        }
        this.run();
    }
}
new ClipTranslate().run();
