/**
 * Created by zhengma on 4/26/16.
 */

var foo = (function () {

    var x1 = 'This is X1';

    var changeX1 = function () {
        x1 = x1 + ' but changed';
        console.log(x1);
    };

    this.changeX1 = changeX1;
    return this;
})();

foo.changeX1();