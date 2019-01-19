function Rule(data) {
    var rules = $('#rules > tbody');
    this.node = $('#rule-template').clone();
    this.node.removeAttr('id');
    this.node.attr('class', 'rule');
    Rule.next_id++;
    this.node.find('.number').html(Rule.next_id);
    rules.append(this.node);

    if (data) {
        this.node.find('.number').text(Rule.next_id);
        this.node.find('.extension').val(data.extension);
        this.node.find('.foldername').val(data.foldername);
    }

    this.node.find('.extension').on('keyup', () => storeRules());

    this.node.find('.foldername').on('keyup', () => storeRules());

    this.node.find('.remove').on('click', () => {
        _this = $(this).parent().parent()

        _this.nextAll().find('.number').each((index, element) => {
            number = $(element).text();
            number--;
            $(element).text(number);
        });
        _this.remove();
        Rule.next_id--;
        storeRules();
    });

    storeRules();
}

Rule.next_id = 0;

function loadRules() {
    var rules = localStorage.rules;
    try {
        JSON.parse(rules).forEach((rule) => {
            new Rule(rule);
        });
    } catch (e) {
        //localStorage.rules = JSON.stringify([]);
    }
}

function storeRules() {
    var rules = [];
    $('.rule').each((index, element) => {
        rules.push({
            extension: $(element).find('.extension').val(),
            foldername: $(element).find('.foldername').val()
        });
    });

    localStorage.rules = JSON.stringify(rules);
    browser.storage.sync.set({
        'rules': JSON.stringify(rules)
    });
}

function init() {
    $('#defaultFolder').val(localStorage.defaultFolder);
    $('#defaultFolder').on('keyup', () => {
        localStorage.defaultFolder = $('#defaultFolder').val();
        browser.storage.sync.set({
            'defaultFolder': $('#defaultFolder').val()
        });
    });

    $('#new').on('click', function() {
        new Rule();
    });

    loadRules();
}

window.onload = () => init();