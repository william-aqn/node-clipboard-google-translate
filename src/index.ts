
import { GoogleTranslator } from '@translate-tools/core/translators/GoogleTranslator/index.js';
import { DeepLTranslator } from '@translate-tools/core/translators/DeepL/index.js';
import { OpenAiTranslator } from './OpenAiTranslator/index.js';
import minimist from 'minimist';
import fs from 'fs';

import {
    FlexLayout,
    QApplication,
    QClipboardMode,
    QCheckBox,
    QLabel,
    QLineEdit,
    CheckState,
    QPlainTextEdit,
    QComboBox,
    QMainWindow,
    QPushButton,
    QWidget,
} from '@nodegui/nodegui'

class ClipTranslate {
    text: string
    promptDefault: string
    configFile: string
    config: any
    translator: any;
    clipboard: any;
    win: any;
    winStatus: any;
    winText: any;
    winCheckbox: any;
    winLangFromComboBox: any;
    winLangToComboBox: any;

    constructor() {
        this.promptDefault = 'Please translate the user message from #from# to #to#. Make the translation sound as natural as possible.';
        this.configFile = 'config.json';
        // Загружаем настройки
        this.loadConfig();
        this.text = '';
        this.clipboard = QApplication.clipboard();
        // Рисуем окно
        this.window();
        // Инициируем переводчик по умолчанию
        this.initTranslator()
    }

    loadConfig() {
        var argv = minimist(process.argv.slice(2));
        this.config = {};
        this.config.from = argv.from ?? 'en';
        this.config.to = argv.to ?? 'zh';
        this.config.delay = argv.delay ?? 200;
        this.config.apiKey = argv.key ?? '';
        this.config.clipboardOverride = false;
        this.config.translatorCode = argv.translator ?? 'deepl';
        try {
            if (fs.existsSync(this.configFile)) {
                this.config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
                console.log('config loaded')
            }
        } catch (e) {
            console.log(e)
        }
        this.config.prompt = this.config.prompt ?? this.promptDefault;
    }

    saveConfig() {
        try {
            fs.writeFileSync(this.configFile, JSON.stringify(this.config));
            console.log('config saved')
        } catch (e) {
            console.log(e)
        }
    }

    initGoogleTranslator() {
        this.translator = new GoogleTranslator({
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
            },
            apiKey: this.config.apiKey
        });
    }

    initOpenAiTranslator() {
        this.translator = new OpenAiTranslator({
            apiKey: this.config.apiKey,
            prompt: this.config.prompt
        });
    }

    initDeepL() {
        this.translator = new DeepLTranslator({ apiKey: this.config.apiKey });
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
        win.resize(600, 400);

        // Основная область
        const centralWidget = new QWidget();
        centralWidget.setObjectName("rootView");
        const rootLayout = new FlexLayout();
        centralWidget.setLayout(rootLayout);

        // Область для кнопки и чекбокса
        const fieldset = new QWidget();
        fieldset.setObjectName('operationView');
        const fieldsetLayout = new FlexLayout();
        fieldset.setLayout(fieldsetLayout);

        const translatorView = new QWidget();
        const translatorLayout = new FlexLayout();
        translatorView.setObjectName('translatorView');
        translatorView.setLayout(translatorLayout);

        // Кнопка
        const buttonCopy = new QPushButton();
        buttonCopy.setText('Скопировать');
        buttonCopy.setObjectName('buttonCopy');
        // Принудительно копируем в буфер содержимое текста с результатом
        buttonCopy.addEventListener('clicked', () => {
            this.clipboard.setText(this.text, QClipboardMode.Clipboard);
        });

        // Статус
        const statusLabel = new QLabel();
        statusLabel.setInlineStyle(`color: green;`);
        statusLabel.setObjectName("statusLabel");

        // Чекбокс
        const isRun = new QCheckBox();
        isRun.setText('Включить перевод буфера');
        isRun.setObjectName('isRun');
        isRun.setCheckState(this.config.clipboardOverride ? CheckState.Checked : CheckState.Unchecked)
        isRun.addEventListener('toggled', () => {
            this.config.clipboardOverride = isRun.isChecked()
            statusLabel.setText(this.config.clipboardOverride ? "Перевод буфера активен" : "Отключен перевод буфера");
            this.saveConfig();
        });

        // Api ключ переводчика
        const apiKeyLabel = new QLabel();
        apiKeyLabel.setText('API ключ переводчика:');
        const apiKeyInput = new QLineEdit();
        apiKeyInput.setObjectName('apiKeyInput');
        apiKeyInput.setText(this.config.apiKey);
        apiKeyInput.addEventListener('textChanged', (text) => {
            this.config.apiKey = text;
            this.windowStatus(`API ключ установлен ${text}`);
            this.initTranslator();
            this.saveConfig();
        });

        // Promtp переводчика
        const promptLabel = new QLabel();
        promptLabel.setText('Promtp переводчика:');
        const promptInput = new QLineEdit();
        promptInput.setObjectName('promptInput');
        promptInput.setText(this.config.prompt);
        promptInput.addEventListener('textChanged', (text) => {
            this.config.prompt = text;
            this.windowStatus(`Prompt ключ установлен ${text}`);
            this.initTranslator();
            this.saveConfig();
        });

        // Выбор переводчика
        const translatorComboBox = new QComboBox();
        translatorComboBox.setObjectName('translatorComboBox');
        translatorComboBox.addItem(undefined, 'google');
        translatorComboBox.addItem(undefined, 'deepl');
        translatorComboBox.addItem(undefined, 'openai');
        translatorComboBox.setCurrentText(this.config.translatorCode);

        translatorComboBox.addEventListener('currentTextChanged', (text) => {
            this.config.translatorCode = text;
            this.initTranslator();
            this.saveConfig();
        });


        // Направление перевода
        const langFromComboBox = new QComboBox();
        langFromComboBox.setObjectName('langFromComboBox');
        const langToComboBox = new QComboBox();
        langToComboBox.setObjectName('langToComboBox');

        // Текст с результатом
        const textWork = new QPlainTextEdit();
        textWork.setObjectName('textWork');
        textWork.setReadOnly(true);
        textWork.setWordWrapMode(3);
        textWork.setPlainText(``);

        // Добавляем настройки переводчика
        translatorLayout.addWidget(translatorComboBox);
        translatorLayout.addWidget(apiKeyLabel);
        translatorLayout.addWidget(apiKeyInput);

        translatorLayout.addWidget(promptLabel);
        translatorLayout.addWidget(promptInput);

        // Добавляем направление языка и чекбокс
        fieldsetLayout.addWidget(langFromComboBox);
        fieldsetLayout.addWidget(langToComboBox);
        fieldsetLayout.addWidget(isRun);

        // Добавляем строку с настройками переводчика
        rootLayout.addWidget(translatorView);
        // Добавляем строку с кнопками и чекбоксом и направлением перевода
        rootLayout.addWidget(fieldset);
        // Добавляем статус
        rootLayout.addWidget(statusLabel);
        // Добавляем кнопку скопировать
        rootLayout.addWidget(buttonCopy);
        // Добавляем поле с результатом
        rootLayout.addWidget(textWork);

        // TODO: Стили
        win.setStyleSheet(`
#rootView{
    flex: 1;
}
#operationView{
    flex: 1;
}
#buttonCopy, #isRun, #langFromComboBox, #langToComboBox, #translatorComboBox{
    flex-direction: row;
}
#statusLabel {
    flex: 1;
}
#textWork {
    flex: 3;
    background-color: white;
}
`);
        win.setCentralWidget(centralWidget);
        win.show();

        this.win = win;
        this.winStatus = statusLabel;
        this.winText = textWork;
        this.winCheckbox = isRun;
        this.winLangFromComboBox = langFromComboBox;
        this.winLangToComboBox = langToComboBox;
    }

    initTranslator() {
        if (this.config.translatorCode == 'deepl') {
            this.initDeepL();
        } else if (this.config.translatorCode == 'openai') {
            this.initOpenAiTranslator();
        } else {
            this.initGoogleTranslator();
        }
        this.windowsInitLangs();
        this.winStatus?.setText(`Переводчик установлен ${this.config.translatorCode}`);
    }

    windowsInitLangs() {
        const obj = (this.translator instanceof DeepLTranslator) ? DeepLTranslator : GoogleTranslator
        const availableLangs = obj.getSupportedLanguages()

        this.winLangFromComboBox.removeEventListener('currentTextChanged')
        this.winLangToComboBox.removeEventListener('currentTextChanged')
        this.winLangFromComboBox.clear();
        this.winLangToComboBox.clear();

        for (let lang of availableLangs) {
            this.winLangFromComboBox.addItem(undefined, lang);
            this.winLangToComboBox.addItem(undefined, lang);
        }

        this.winLangFromComboBox.addEventListener('currentTextChanged', (text: string) => {
            this.config.from = text;
            this.windowStatus(`Перевод с ${this.config.from}`);
            this.saveConfig();
        });
        this.winLangToComboBox.addEventListener('currentTextChanged', (text: string) => {
            this.config.to = text;
            this.windowStatus(`Перевод на ${this.config.to}`);
            this.saveConfig();
        });

        this.winLangFromComboBox.setCurrentText(this.config.from)
        this.winLangToComboBox.setCurrentText(this.config.to)
    }

    async run() {
        await this.sleep(this.config.delay);

        try {
            let clipText = this.getClipboard()
            if (clipText != this.text && clipText != '' && this.config.clipboardOverride) {
                this.windowStatus('Переводим');
                this.setText(clipText);
                let translated = await this.translateText();
                this.setText(translated);
                this.windowStatus('Текст в скопирован в буфер обмена');
            }
        } catch (e) {
            this.windowStatus('Ошибка');
            console.log(e);
        }

        this.run()
    }
    async translateText() {
        return await this.translator.translate(this.text, this.config.from, this.config.to);
    }

    setOnlyText(text: string) {
        this.winText.setPlainText(text);
    }

    addOnlyText(text: string) {
        this.winText.insertPlainText(text);
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

const core = new ClipTranslate()
core.run()
export default core

