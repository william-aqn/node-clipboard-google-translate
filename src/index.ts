
import notifier from 'node-notifier';
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator/index.js';
import minimist from 'minimist';
import {
    FlexLayout,
    QApplication,
    QClipboard,
    QClipboardMode,
    QCheckBox,
    QLabel,
    QLineEdit,
    QPlainTextEdit,
    QScrollArea,
    QMainWindow,
    QPushButton,
    QWidget,
} from '@nodegui/nodegui'

class ClipTranslate {
    text: string
    to: string
    from: string
    delay: number
    translator: any;
    clipboard: any;
    win: any;
    winStatus: any;
    winText: any;
    winCheckbox: any;

    constructor() {
        var argv = minimist(process.argv.slice(2));
        this.to = argv.to ?? 'it';
        this.from = argv.from ?? 'ru';
        this.delay = argv.delay ?? 50;
        this.translator = new GoogleTranslator({
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
            },
        });
        this.text = '';
        this.clipboard = QApplication.clipboard();
        this.window();
    }

    sleep(time: number) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    windowStatusError(text: string) {
        this.winStatus.setText(text);
        this.winStatus.setInlineStyle(`color: red;`);
    }
    windowStatus(text: string) {
        this.winStatus.setText(text);
        this.winStatus.setInlineStyle(`color: green;`);
    }
    window() {
        const win = new QMainWindow();
        win.setWindowTitle('Translator');
        win.resize(400, 200);

        const centralWidget = new QWidget();
        centralWidget.setObjectName("rootView");
        const rootLayout = new FlexLayout();
        centralWidget.setLayout(rootLayout);

        const button = new QPushButton();
        button.setText('Скопировать');
        button.addEventListener('clicked', () => {
            this.clipboard.setText(this.text, QClipboardMode.Clipboard);
        });

        const passOutput = new QPlainTextEdit();
        passOutput.setObjectName('view');
        passOutput.setReadOnly(true);
        passOutput.setWordWrapMode(3);
        passOutput.setPlainText(``);

        const statusLabel = new QLabel();
        statusLabel.setText("Ready");
        statusLabel.setInlineStyle(`color: green;`);

        
        const checkbox = new QCheckBox();
        checkbox.setText('Включен');

        rootLayout.addWidget(button);
        rootLayout.addWidget(statusLabel);
        rootLayout.addWidget(passOutput);

        win.setCentralWidget(centralWidget);
        win.setStyleSheet(`
            #rootView{
                flex: 1;
              }
              #label {
               flex: 1;
               color: white;
               background-color: green;
              }
              #view {
                flex: 3;
                background-color: white;
              }
`);

        win.show();

        this.win = win;
        this.winStatus = statusLabel;
        this.winText = passOutput;
        this.winCheckbox = checkbox;
    }

    async run() {
        await this.sleep(this.delay);

        try {
            let clipText = this.getClipboard()
            if (clipText != this.text && clipText != '') {
                this.text = clipText;
                let translated = await this.translator.translate(this.text, this.from, this.to);
                notifier.notify({
                    title: clipText,
                    message: translated
                });

                this.setText(translated);
            }
        } catch (e) {
            notifier.notify('Error translate');
            console.log(e);
        }

        this.run()
    }
    setText(text: string) {
        this.text = text;
        this.winText.setPlainText(this.text);
        this.clipboard.setText(this.text, QClipboardMode.Clipboard);
    }
    getClipboard() {
        return this.clipboard.text(QClipboardMode.Clipboard)
    }

}

new ClipTranslate().run()