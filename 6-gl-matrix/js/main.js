'use strict'

function main () {
	/* Vectors
	 *
	 */
	var a = vec3.create();
	vec3.set(a, 1., 0., 0.);

	var b = vec3.fromValues(0., 1., 0.);

	var c = vec3.create();
	vec3.add(c, a, b);

	var d = vec3.create();
	vec3.cross(d, a, b);
	var msg = "a = " + vec3.str(a) + "\n" +
			"b = " + vec3.str(b) + "\n" +
			"c = a + b = " + vec3.str(c) + "\n" +
			"d = a X b = " + vec3.str(d);
	alert(msg);

	/* Matrices
	 *
	 */
	var ma = mat3.create();
	mat3.set(ma, 1, 2, 0, 
				3, 4, 0, 
				5, 6, 1);
	
	var mb = mat3.fromValues(1, 2, 0, 3, 4, 0, 5, 6, 1);

	var mc = mat3.create();
	mat3.add(mc, ma, mb);

	var md = mat3.create();
	mat3.multiply(md, ma, mb);

	msg = "ma = " + mat3.str(ma) + "\n" +
		"mb = " + mat3.str(mb) + "\n" +
		"mc = ma + mb = " + mat3.str(mc) + "\n" +
		"md = AB = " + mat3.str(md);
	alert(msg);
}