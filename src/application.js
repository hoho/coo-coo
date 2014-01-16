(function() {
    /* global cooObjectBase */

    cooObjectBase(
        {
            cmdName: 'APPLICATION',
            cmdStorage: 'CooCoo',
            baseClass: {name: 'CooCoo.AppBase'}
        },
        {
            init: true,
            destroy: true,
            properties: true,
            methods: true
        },
        {}
    );
})();
