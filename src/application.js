(function() {
    /* global cooObjectBase */

    cooObjectBase(
        {
            cmdName: 'application',
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
